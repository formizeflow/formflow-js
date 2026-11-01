import type { HttpClient, RequestOptions } from "../core";

export type ExportJob = { export: { id: string; formId: string; format: "csv" | "json" | "xlsx" | "pdf"; status: "queued" | "running" | "done" | "failed"; error: string | null; expiresAt: number | null; createdAt: number }; url?: string };

export class ExportsResource {
  constructor(private readonly h: HttpClient) {}
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
