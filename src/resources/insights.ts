import type { HttpClient, RequestOptions } from "../core";
import type { Condition } from "./definition";

type Json = Record<string, unknown>;
export type ChartKind = "auto" | "bar" | "column" | "pie" | "donut" | "line" | "number" | "table" | "wordcloud";
export type DashboardWidget = { id: string; formId: string; fieldId?: string; metric?: "responses" | "completion_rate" | "avg_time" | "views"; chart?: ChartKind; title?: string; span?: 1 | 2 | 3; windowDays?: number };
export type Dashboard = { id: string; name: string; widgets: DashboardWidget[]; shared: boolean; createdAt: number; updatedAt: number };
export type FileResult = { filename: string; contentType: string; encoding: "utf8" | "base64"; content: string; rows?: number };
export type ResponseImportInput = { format: "csv" | "xlsx"; content: string; mapping?: Record<string, string | null>; dryRun?: boolean; onError?: "skip" | "abort" };
export type ResponseImportResult = { dryRun: boolean; rows: number; imported: number; skipped: number; mapping: Record<string, string | null>; unmapped: string[]; errors: { row: number; errors: Record<string, string> }[] };
export type BulkResult = { index: number; ok: boolean; id?: string; error?: { code: string; message: string; details?: unknown } };
export type TagRuleInput = { name: string; when: Condition; tags: string[]; assigneeId?: string | null; enabled?: boolean };
export type ChatAction = { type: "add_chart" | "ask" | "tag_responses"; label: string; params: Json };
export type ChatReply = { answer: string; themes: Json[]; actions: ChatAction[]; caveats: string[]; sampleSize: number; totalResponses: number; aiGenerated: true };

/** Results and analytics beyond the basics: dashboards, import, BI feeds, exports, AI chat, grading, tagging, comments, bulk writes. */
export class InsightsResource {
  constructor(private readonly h: HttpClient) {}

  readonly dashboards = {
    list: (o?: RequestOptions) => this.h.data<Dashboard[]>("GET", "/dashboards", o),
    get: (id: string, o?: RequestOptions) => this.h.data<Dashboard>("GET", `/dashboards/${id}`, o),
    create: (body: { name: string; widgets: DashboardWidget[] }, o?: RequestOptions) => this.h.data<Dashboard>("POST", "/dashboards", { body, ...o }),
    update: (id: string, body: { name?: string; widgets?: DashboardWidget[] }, o?: RequestOptions) => this.h.data<Dashboard>("PATCH", `/dashboards/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/dashboards/${id}`, o),
    /** Every widget's computed data (summaries and metrics). */
    data: (id: string, o?: RequestOptions) => this.h.data<Json>("GET", `/dashboards/${id}/data`, o),
    /** enabled=true returns the public url and iframe snippet once. */
    share: (id: string, enabled: boolean, o?: RequestOptions) => this.h.data<{ shared: boolean; url: string | null; embed: string | null }>("POST", `/dashboards/${id}/share`, { body: { enabled }, ...o }),
  };

  /** Crosstab with chi-square and per-cell significance. */
  significance(formId: string, q: { rowFieldId: string; colFieldId: string; alpha?: number; filters?: Condition }, o?: RequestOptions) {
    return this.h.data<Json>("GET", `/forms/${formId}/analytics/significance`, { query: { ...q, filters: q.filters ? JSON.stringify(q.filters) : undefined }, ...o });
  }
  readonly compareRules = {
    list: (formId: string, o?: RequestOptions) => this.h.data<Json[]>("GET", `/forms/${formId}/compare-rules`, o),
    save: (formId: string, body: { name: string; rowFieldId: string; colFieldId: string; filters?: Condition; alpha?: number }, o?: RequestOptions) => this.h.data<Json>("POST", `/forms/${formId}/compare-rules`, { body, ...o }),
    run: (ruleId: string, o?: RequestOptions) => this.h.data<Json>("GET", `/compare-rules/${ruleId}`, o),
    delete: (ruleId: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/compare-rules/${ruleId}`, o),
  };

  /** Ask a question about the results; returns an answer and suggested actions. */
  chat(formId: string, body: { message: string; filters?: Condition; fieldIds?: string[] }, o?: RequestOptions) { return this.h.data<ChatReply>("POST", `/forms/${formId}/ai/chat`, { body, ...o }); }

  /** CSV text or base64 XLSX mapped to field ids. Use dryRun to validate first. */
  importResponses(formId: string, body: ResponseImportInput, o?: RequestOptions) { return this.h.data<ResponseImportResult>("POST", `/forms/${formId}/import`, { body, ...o }); }
  /** format: docx and spss come back base64, html and print as text. */
  report(formId: string, format: "docx" | "html" | "spss" | "print", filters?: Condition, o?: RequestOptions) { return this.h.data<FileResult>("GET", `/forms/${formId}/report`, { query: { format, filters: filters ? JSON.stringify(filters) : undefined }, ...o }); }

  readonly feeds = {
    list: (formId: string, o?: RequestOptions) => this.h.data<Json[]>("GET", `/forms/${formId}/feed-tokens`, o),
    /** The token and its csv / json / odata URLs are returned once. */
    create: (formId: string, name: string, o?: RequestOptions) => this.h.data<{ id: string; token: string; urls: { csv: string; json: string; odata: string } }>("POST", `/forms/${formId}/feed-tokens`, { body: { name }, ...o }),
    revoke: (tokenId: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/feed-tokens/${tokenId}`, o),
  };

  readonly grading = {
    queue: (formId: string, q?: { pendingOnly?: boolean; limit?: number }, o?: RequestOptions) => this.h.data<Json>("GET", `/forms/${formId}/grading`, { query: q, ...o }),
    grade: (submissionId: string, body: { points: Record<string, number>; feedback?: Record<string, string>; max?: number }, o?: RequestOptions) => this.h.data<Json>("POST", `/submissions/${submissionId}/grade`, { body, ...o }),
    release: (formId: string, body: { submissionIds?: string[]; email?: boolean } = {}, o?: RequestOptions) => this.h.data<{ released: number; emailed: number }>("POST", `/forms/${formId}/grading/release`, { body, ...o }),
  };

  readonly tagRules = {
    list: (formId: string, o?: RequestOptions) => this.h.data<Json[]>("GET", `/forms/${formId}/tag-rules`, o),
    create: (formId: string, body: TagRuleInput, o?: RequestOptions) => this.h.data<Json>("POST", `/forms/${formId}/tag-rules`, { body, ...o }),
    update: (ruleId: string, body: Partial<TagRuleInput>, o?: RequestOptions) => this.h.data<Json>("PATCH", `/tag-rules/${ruleId}`, { body, ...o }),
    delete: (ruleId: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/tag-rules/${ruleId}`, o),
    /** Tags the responses already collected. */
    apply: (formId: string, o?: RequestOptions) => this.h.data<{ scanned: number; tagged: number }>("POST", `/forms/${formId}/tag-rules/apply`, { body: {}, ...o }),
  };

  readonly comments = {
    list: (submissionId: string, o?: RequestOptions) => this.h.data<Json[]>("GET", `/submissions/${submissionId}/comments`, o),
    /** Mention a teammate with @email. */
    add: (submissionId: string, body: string, o?: RequestOptions) => this.h.data<Json>("POST", `/submissions/${submissionId}/comments`, { body: { body }, ...o }),
    delete: (commentId: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/comments/${commentId}`, o),
  };

  readonly bulk = {
    /** Up to 100 per call; each item reports its own result. */
    create: (formId: string, items: { answers: Record<string, unknown> }[], o?: RequestOptions) => this.h.data<{ created: number; failed: number; results: BulkResult[] }>("POST", `/forms/${formId}/submissions/bulk`, { body: { items }, ...o }),
    update: (items: { id: string; answers?: Record<string, unknown>; status?: "completed" | "spam" }[], o?: RequestOptions) => this.h.data<{ updated: number; failed: number; results: BulkResult[] }>("POST", "/submissions/bulk-update", { body: { items }, ...o }),
    delete: (ids: string[], o?: RequestOptions) => this.h.data<{ deleted: number }>("POST", "/submissions/bulk-delete", { body: { ids }, ...o }),
  };

  /** Responses and team actions across the workspace. */
  activity(days = 30, o?: RequestOptions) { return this.h.data<Json>("GET", "/activity", { query: { days }, ...o }); }
}
