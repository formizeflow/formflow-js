import type { HttpClient, RequestOptions } from "../core";
import type { Condition, FormDefinition, Theme } from "./definition";

export type Attributes = Record<string, string | number | boolean>;
export type DecideRequest = {
  /** Experiment entry slug, journey id (jrn_...) or form slug. */
  entry: string;
  /** Optional: derived from the entry. */
  workspace?: string;
  uid?: string;
  /** Lowercase hex HMAC-SHA256 of `uid` keyed with the workspace identity secret. Not needed on the authenticated variant. */
  uid_sig?: string;
  attributes?: Attributes;
  ph_session?: string;
  ph_distinct?: string;
  /** Throw away the saved partial and start over. */
  restart?: boolean;
  /** false disables server-side resume (the `resume=0` URL param). */
  resume?: boolean;
  /** false returns only the decision, without the definition. */
  definition?: boolean;
};
export type DecideResult = {
  show: boolean;
  /** holdout, already_completed, stage_open, waiting, all_completed, ... */
  reason: string;
  experimentId?: string; variantId?: string; formId?: string; slug?: string; versionId?: string;
  journeyStep?: { journeyId: string; stageId: string; name: string; index: number; total: number };
  resume?: { token: string; submissionId: string; progress: { answered: number; total: number; percent: number } };
  definition?: FormDefinition;
  theme?: Theme;
  attributes?: Record<string, string | number | boolean | null>;
  known?: Record<string, unknown>;
};

export type ProfileSourceInput =
  | { kind: "endpoint"; name: string; url: string; secret: string }
  | { kind: "posthog"; name: string; host?: string; projectId: string; apiKey: string };
export type ProfileSource = { id: string; name: string; kind: "endpoint" | "posthog"; config: Record<string, string>; createdAt: number; updatedAt: number };

export type JourneyStage = { id: string; name: string; formId?: string; entrySlug?: string; after?: { stage?: string; event?: string; days?: number }; when?: Condition };
export type JourneyInput = { name: string; status?: "draft" | "active" | "paused"; definition: { stages: JourneyStage[]; eventSourceId?: string } };
export type Journey = { id: string; name: string; status: "draft" | "active" | "paused"; definition: JourneyInput["definition"]; createdAt: number; updatedAt: number };
export type JourneyAnalytics = {
  stages: { stageId: string; name: string; started: number; completed: number; conversionFromPrevious: number | null; completionRate: number | null }[];
  events: { event: string; uids: number }[];
};

export type AutopilotLimits = { maxPendingVariants: number; maxAppliedPerWeek: number; minSamplePerArm: number; confidence: number };
export type AutopilotAction = {
  id: string; experimentId: string; kind: "propose_variant" | "retire_arm";
  status: "pending" | "approved" | "rejected" | "applied" | "failed";
  proposal: Record<string, unknown>; rationale: string; log: { at: number; actor: string; step: string; note?: string }[]; createdAt: number;
};

export class OnboardingResource {
  constructor(private readonly h: HttpClient) {}

  /** For backends: the uid is trusted, no signature needed. Respondent apps use `client.public.decide`. */
  decide(body: DecideRequest, o?: RequestOptions) { return this.h.data<DecideResult>("POST", "/onboarding/decide", { body, ...o }); }
  /** Describe your app and users; get a draft onboarding form, variant drafts with hypotheses and a suggested experiment. Nothing is published. */
  generate(body: { description: string; audience?: string; goal?: string; variantCount?: number }, o?: RequestOptions) { return this.h.data<Record<string, unknown>>("POST", "/onboarding/generate", { body, ...o }); }
  digest(body: { send?: boolean } = {}, o?: RequestOptions) { return this.h.data<Record<string, unknown>>("POST", "/onboarding/digest", { body, ...o }); }
  /** AI themes in an open-text field, with counts and PII-free example quotes. */
  themes(formId: string, q: { fieldId?: string; variantId?: string } = {}, o?: RequestOptions) { return this.h.data<Record<string, unknown>>("GET", `/forms/${formId}/themes`, { query: q, ...o }); }

  readonly profileSources = {
    list: (o?: RequestOptions) => this.h.data<ProfileSource[]>("GET", "/profile-sources", o),
    create: (body: ProfileSourceInput, o?: RequestOptions) => this.h.data<ProfileSource>("POST", "/profile-sources", { body, ...o }),
    update: (id: string, body: ProfileSourceInput, o?: RequestOptions) => this.h.data<ProfileSource>("PATCH", `/profile-sources/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/profile-sources/${id}`, o),
  };

  readonly journeys = {
    list: (o?: RequestOptions) => this.h.data<Journey[]>("GET", "/journeys", o),
    get: (id: string, o?: RequestOptions) => this.h.data<Journey>("GET", `/journeys/${id}`, o),
    create: (body: JourneyInput, o?: RequestOptions) => this.h.data<Journey>("POST", "/journeys", { body, ...o }),
    update: (id: string, body: JourneyInput, o?: RequestOptions) => this.h.data<Journey>("PATCH", `/journeys/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/journeys/${id}`, o),
    /** Report a product event (for example `first_project_created`) so stage entry conditions can see it. */
    event: (id: string, body: { uid: string; event: string; props?: Record<string, unknown>; occurredAt?: number }, o?: RequestOptions) => this.h.data<{ id: string }>("POST", `/journeys/${id}/events`, { body, ...o }),
    analytics: (id: string, o?: RequestOptions) => this.h.data<JourneyAnalytics>("GET", `/journeys/${id}/analytics`, o),
  };

  readonly autopilot = {
    get: (experimentId: string, o?: RequestOptions) => this.h.data<Record<string, unknown>>("GET", "/autopilot", { query: { experimentId }, ...o }),
    set: (body: { experimentId: string; enabled: boolean; autoApply?: boolean; limits?: Partial<AutopilotLimits> }, o?: RequestOptions) => this.h.data<Record<string, unknown>>("PUT", "/autopilot", { body, ...o }),
    actions: (q: { experimentId?: string; status?: AutopilotAction["status"] } = {}, o?: RequestOptions) => this.h.data<AutopilotAction[]>("GET", "/autopilot/actions", { query: q, ...o }),
    propose: (experimentId: string, o?: RequestOptions) => this.h.data<AutopilotAction>("POST", "/autopilot/propose", { body: { experimentId }, ...o }),
    approve: (id: string, o?: RequestOptions) => this.h.data<AutopilotAction>("POST", `/autopilot/actions/${id}/approve`, o),
    reject: (id: string, o?: RequestOptions) => this.h.data<AutopilotAction>("POST", `/autopilot/actions/${id}/reject`, o),
  };
}
