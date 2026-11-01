import type { HttpClient, RequestOptions } from "../core";

type Json = Record<string, unknown>;
export type ExperimentKind = "ab" | "multivariate" | "question";
export type ExperimentStatus = "draft" | "running" | "stopped" | "completed";
export type ExperimentVariant = {
  id: string; name: string; weight: number;
  /** Copy, layout, theme knobs, blocks; `question` for question-level tests. */
  patch?: Json;
  /** A different published form of the workspace: a whole-flow variant. */
  formId?: string;
};
export type Experiment = {
  id: string; formId: string; name: string; status: ExperimentStatus; kind: ExperimentKind; entrySlug: string | null;
  variants: (ExperimentVariant & { paused?: boolean })[]; winnerVariantId: string | null; config: Json; startedAt: number | null; endedAt: number | null;
};
export type ExperimentInput = {
  name: string; kind?: ExperimentKind; entrySlug?: string | null; variants?: ExperimentVariant[];
  /** assignment, primary/secondary metrics, guardrails, traffic, layer, holdout, holdoutExit, targeting, schedule, ramp, bandit, autoStop, forward, factors, question. */
  config?: Json;
};
export type Conversion = { uid: string; event: string; value?: number; eventId?: string; occurredAt?: number };
export type ConversionResult = { recorded: boolean; attributed: boolean; variantId?: string };

/** A/B, multivariate and question-level experiments, downstream conversions and AI help. */
export class ExperimentsResource {
  constructor(private readonly h: HttpClient) {}
  list(q: { formId?: string; status?: ExperimentStatus } = {}, o?: RequestOptions) { return this.h.data<Experiment[]>("GET", "/experiments", { query: q, ...o }); }
  get(id: string, o?: RequestOptions) { return this.h.data<Experiment>("GET", `/experiments/${id}`, o); }
  create(body: ExperimentInput & { formId: string }, o?: RequestOptions) { return this.h.data<Experiment>("POST", "/experiments", { body, ...o }); }
  update(id: string, test: ExperimentInput, o?: RequestOptions) { return this.h.data<Experiment>("PATCH", `/experiments/${id}`, { body: { action: "update", test }, ...o }); }
  delete(id: string, o?: RequestOptions) { return this.h.data<null>("DELETE", `/experiments/${id}`, o); }
  start(id: string, o?: RequestOptions) { return this.h.data<Experiment>("PATCH", `/experiments/${id}`, { body: { action: "start" }, ...o }); }
  stop(id: string, o?: RequestOptions) { return this.h.data<Experiment>("PATCH", `/experiments/${id}`, { body: { action: "stop" }, ...o }); }
  /** `promote: false` only marks the winner and stops the test. */
  declareWinner(id: string, variantId: string, promote?: boolean, o?: RequestOptions) { return this.h.data<{ experiment: Experiment }>("PATCH", `/experiments/${id}`, { body: { action: "winner", variantId, promote }, ...o }); }
  /** Keeps the winning version per segment as permanent targeting rules and ends the test. */
  personalize(id: string, body: { attrs?: string[]; minProbability?: number } = {}, o?: RequestOptions) { return this.h.data<Json>("PATCH", `/experiments/${id}`, { body: { action: "personalize", ...body }, ...o }); }
  results(id: string, o?: RequestOptions) { return this.h.data<Json>("GET", `/experiments/${id}/results`, o); }
  /** Report a downstream goal for a user from your backend (key needs form:write). `uid` is the id your app passes to the form. */
  reportConversion(id: string, body: Conversion, o?: RequestOptions) { return this.h.data<ConversionResult>("POST", `/experiments/${id}/conversions`, { body, ...o }); }
  explain(id: string, o?: RequestOptions) { return this.h.data<Json>("POST", `/experiments/${id}/ai/explain`, { body: {}, ...o }); }
  suggest(id: string, o?: RequestOptions) { return this.h.data<Json>("POST", `/experiments/${id}/ai/suggest`, { body: {}, ...o }); }
}
