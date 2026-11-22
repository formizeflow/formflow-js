import type { HttpClient, RequestOptions } from "../core";

export type ExportFormat = "csv" | "json" | "xlsx" | "pdf" | "sav";
export type ExportJob = { export: { id: string; formId: string; format: ExportFormat; status: "queued" | "running" | "done" | "failed"; error: string | null; expiresAt: number | null; createdAt: number }; url?: string };

type Json = Record<string, unknown>;
export type ExportScheduleInput = {
  name: string; /** 5-field cron, e.g. "0 8 * * 1" for Mondays 08:00. */ schedule: string; format: "csv" | "json" | "xlsx" | "bundle"; delivery: "email_link" | "storage";
  /** Required for email_link. */ recipients?: string[]; /** Export filter, e.g. { sinceLastRun: true, status: "completed" }. */ filter?: Json; enabled?: boolean;
};
export type DocumentTemplate = { id: string; formId: string; name: string; config: Json; createdAt: number; updatedAt: number };

export class ExportsResource {
  constructor(private readonly h: HttpClient) {}
  /** Recurring exports of a form's responses. */
  readonly schedules = {
    list: (formId: string, o?: RequestOptions) => this.h.data<Json[]>("GET", `/forms/${formId}/export-schedules`, o),
    create: (formId: string, body: ExportScheduleInput, o?: RequestOptions) => this.h.data<Json>("POST", `/forms/${formId}/export-schedules`, { body, ...o }),
    update: (scheduleId: string, body: Partial<ExportScheduleInput>, o?: RequestOptions) => this.h.data<Json>("PATCH", `/export-schedules/${scheduleId}`, { body, ...o }),
    delete: (scheduleId: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/export-schedules/${scheduleId}`, o),
    /** Queue one run now. */
    run: (scheduleId: string, o?: RequestOptions) => this.h.data<{ queued: boolean }>("POST", `/export-schedules/${scheduleId}/run`, { body: {}, ...o }),
  };
  /** Document templates that turn one response into a PDF or Word file. */
  readonly documentTemplates = {
    list: (formId: string, o?: RequestOptions) => this.h.data<DocumentTemplate[]>("GET", `/forms/${formId}/document-templates`, o),
    create: (formId: string, body: { name: string; config?: Json }, o?: RequestOptions) => this.h.data<DocumentTemplate>("POST", `/forms/${formId}/document-templates`, { body, ...o }),
    /** A Word file (base64, up to 1.4 MB) with {{placeholders}}. */
    uploadDocx: (formId: string, body: { name: string; data: string }, o?: RequestOptions) => this.h.data<DocumentTemplate>("POST", `/forms/${formId}/document-templates/docx`, { body, ...o }),
    /** A fillable PDF (base64, up to 1.4 MB); map its fields with `update`. */
    uploadPdf: (formId: string, body: { name: string; data: string }, o?: RequestOptions) => this.h.data<DocumentTemplate>("POST", `/forms/${formId}/document-templates/pdf`, { body, ...o }),
    update: (templateId: string, body: { name?: string; config?: Json }, o?: RequestOptions) => this.h.data<DocumentTemplate>("PATCH", `/document-templates/${templateId}`, { body, ...o }),
    delete: (templateId: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/document-templates/${templateId}`, o),
  };
  get(id: string, o?: RequestOptions) { return this.h.data<ExportJob>("GET", `/exports/${id}`, o); }
  /** Poll until the export is done or failed. */
  async wait(id: string, opts: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}): Promise<ExportJob> {
    const deadline = Date.now() + (opts.timeoutMs ?? 120_000);
    for (;;) {
      const j = await this.get(id, { signal: opts.signal });
      if (j.export.status === "done" || j.export.status === "failed") return j;
      if (Date.now() > deadline) throw new Error(`Export ${id} did not finish in time`);
      await new Promise((r) => setTimeout(r, opts.intervalMs ?? 1500));
    }
  }
}
