import type { HttpClient, ListParams, Page, RequestOptions } from "../core";
import type { Condition } from "./definition";
import type { ExportJob } from "./exports";

export type SubmissionStatus = "partial" | "completed" | "spam" | "deleted";
export type Submission = {
  id: string; formId: string; formVersionId: string; workspaceId: string; status: SubmissionStatus;
  answers: Record<string, unknown>; computed: Record<string, unknown> | null;
  attribution: Record<string, string> | null; metadata: Record<string, unknown> | null;
  respondentId: string | null; paymentStatus: "none" | "pending" | "paid" | "failed" | "refunded";
  createdAt: number; updatedAt: number; completedAt: number | null;
  /** Present with `expand: ["form"]`. */
  form?: { id: string; name: string; slug: string; status: string };
};
export type ListSubmissionsParams = ListParams & {
  status?: SubmissionStatus; from?: number | string; to?: number | string; q?: string;
  /** Structured filter (sent as JSON). */
  filters?: Condition; sort?: "createdAt:asc" | "createdAt:desc";
  expand?: "form"[]; fields?: string[]; redact?: "sensitive";
};
export type SearchSubmissionsInput = Omit<ListSubmissionsParams, "redact" | "expand"> & { expand?: "form"[]; includeSensitive?: boolean };

const csv = (a?: string[]) => (a?.length ? a.join(",") : undefined);
const prep = (q?: ListSubmissionsParams) => q && { ...q, expand: csv(q.expand), fields: csv(q.fields), filters: q.filters ? JSON.stringify(q.filters) : undefined };

export class SubmissionsResource {
  constructor(private readonly h: HttpClient) {}

  list(formId: string, q?: ListSubmissionsParams, o?: RequestOptions): Promise<Page<Submission>> { return this.h.page<Submission>(`/forms/${formId}/submissions`, prep(q), o); }
  listAll(formId: string, q?: ListSubmissionsParams, o?: RequestOptions) { return this.h.paginate<Submission>(`/forms/${formId}/submissions`, prep(q) ?? {}, o); }
  /** Same filters in a request body. Sensitive fields are redacted unless `includeSensitive` (needs workspace:manage). */
  search(formId: string, body: SearchSubmissionsInput = {}, o?: RequestOptions): Promise<Page<Submission>> {
    return this.h.request<Page<Submission>>("POST", `/forms/${formId}/submissions/search`, { body, ...o }).then((r) => ({ data: r.data, nextCursor: r.nextCursor ?? null }));
  }
  /** Iterate every match of a search. */
  async *searchAll(formId: string, body: SearchSubmissionsInput = {}, o?: RequestOptions): AsyncGenerator<Submission, void, void> {
    let cursor = body.cursor;
    do {
      const p = await this.search(formId, { ...body, cursor }, o);
      yield* p.data;
      cursor = p.nextCursor ?? undefined;
    } while (cursor);
  }
  get(id: string, q: { expand?: "form"[]; redact?: "sensitive" } = {}, o?: RequestOptions) { return this.h.data<Submission>("GET", `/submissions/${id}`, { query: { expand: csv(q.expand), redact: q.redact }, ...o }); }
  update(id: string, body: { answers?: Record<string, unknown>; status?: "completed" | "spam" }, o?: RequestOptions) { return this.h.data<Submission>("PATCH", `/submissions/${id}`, { body, ...o }); }
  delete(id: string, o?: RequestOptions) { return this.h.data<null>("DELETE", `/submissions/${id}`, o); }
  bulkDelete(ids: string[], o?: RequestOptions) { return this.h.data<{ deleted: number }>("POST", "/submissions/bulk-delete", { body: { ids }, ...o }); }
  /** Start an export of matching responses. Poll with `exports.get`. */
  export(formId: string, body: { format?: "csv" | "json" | "xlsx" | "pdf"; filter?: { status?: "completed" | "partial" | "any"; from?: number; to?: number; filters?: Condition; includeSensitive?: boolean } } = {}, o?: RequestOptions) {
    return this.h.data<ExportJob>("POST", `/forms/${formId}/exports`, { body, ...o });
  }
  bulkExport(body: { formId: string; ids?: string[]; format?: "csv" | "json" | "xlsx" | "pdf"; filter?: Record<string, unknown> }, o?: RequestOptions) {
    return this.h.data<ExportJob>("POST", "/submissions/bulk-export", { body, ...o });
  }
}
