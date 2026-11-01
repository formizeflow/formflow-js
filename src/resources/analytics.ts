import type { HttpClient, RequestOptions } from "../core";
import type { Condition } from "./definition";

export type Metric<T = number | null> = { value: T; kind: "measured" | "estimated"; note?: string };
export type AnalyticsRange = { from?: number | string; to?: number | string; versionId?: string; bucket?: "day" | "week" };
/** Shape of the metrics payload; extra breakdowns (devices, sources, utm, channels, trends) are present as documented in openapi.json. */
export type FormMetrics = { views?: Metric; starts?: Metric; completions?: Metric; completionRate?: Metric; avgTimeMs?: Metric; [breakdown: string]: unknown };
export type QuestionSummary = { summary: { kind: string; [k: string]: unknown }; sampleSize: number };
export type SatisfactionResult = { fieldId: string; label: string; type: "nps" | "csat" | "ces" } & QuestionSummary;
export type FunnelResult = { steps: { id: string; label: string; count: number; rate?: number | null }[]; kind: "measured" | "estimated"; caveats: string[] };

export class AnalyticsResource {
  constructor(private readonly h: HttpClient) {}
  metrics(formId: string, q: AnalyticsRange = {}, o?: RequestOptions) { return this.h.data<FormMetrics>("GET", `/forms/${formId}/analytics`, { query: q, ...o }); }
  question(formId: string, fieldId: string, q: { from?: number | string; to?: number | string; status?: "completed" | "partial" | "any"; filters?: Condition } = {}, o?: RequestOptions) {
    return this.h.data<QuestionSummary>("GET", `/forms/${formId}/analytics/questions/${fieldId}`, { query: q, ...o });
  }
  funnel(formId: string, q: AnalyticsRange = {}, o?: RequestOptions) { return this.h.data<FunnelResult>("GET", `/forms/${formId}/analytics/funnel`, { query: q, ...o }); }
  /** NPS / CSAT / CES for every such field (or one `fieldId`). */
  satisfaction(formId: string, q: { fieldId?: string; from?: number | string; to?: number | string } = {}, o?: RequestOptions) { return this.h.data<SatisfactionResult[]>("GET", `/forms/${formId}/analytics/satisfaction`, { query: q, ...o }); }
  scores(formId: string, o?: RequestOptions) { return this.h.data<Record<string, unknown>>("GET", `/forms/${formId}/analytics/scores`, o); }
}
