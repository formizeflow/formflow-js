import { errorFor } from "../errors";
import type { FormDefinition, Theme } from "./definition";
import type { DecideRequest, DecideResult } from "./onboarding";

/** Respondent-facing endpoints. No API key; safe to use from browsers. Cookies are required only for password-protected forms. */
export type PublicForm = {
  form: { id: string; workspaceId: string; name: string; slug: string; status: string };
  theme: Theme;
  availability: { open: true } | { open: false; reason: "closed" | "archived" | "expired" | "max_responses" | "not_open" };
  passwordRequired: boolean;
  unlocked: boolean;
  /** Absent while a password-protected form is locked. */
  version?: { id: string; version: number; definition: FormDefinition };
};
export type CompleteResult = { submissionId: string; outcome: Record<string, unknown>; ending: Record<string, unknown> | null; redirectUrl?: string; paymentRequired: boolean; checkoutUrl?: string };

export class PublicClient {
  private readonly base: string;
  constructor(o: { baseUrl: string; fetch?: typeof fetch; credentials?: RequestCredentials }, private readonly extra: { credentials?: RequestCredentials } = {}) {
    this.base = `${o.baseUrl.replace(/\/$/, "")}/api/v1/public`;
    this.f = o.fetch ?? fetch;
    this.extra = { credentials: o.credentials ?? extra.credentials };
  }
  private readonly f: typeof fetch;

  private async call<T>(method: string, path: string, body?: unknown, signal?: AbortSignal, headers: Record<string, string> = {}): Promise<T> {
    const res = await this.f(`${this.base}${path}`, {
      method, signal, credentials: this.extra.credentials, headers: { Accept: "application/json", ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 204) return null as T;
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) throw errorFor(res.status, json, res.headers.get("x-request-id") ?? undefined, Number(res.headers.get("retry-after")) || undefined);
    return (json as { data: T }).data;
  }

  getForm(slug: string, signal?: AbortSignal) { return this.call<PublicForm>("GET", `/forms/${encodeURIComponent(slug)}`, undefined, signal); }
  /** Sets an httpOnly cookie on success (use `credentials: "include"` in browsers). Throws PermissionError code "forbidden" / details.reason "wrong_password". */
  unlock(slug: string, password: string, signal?: AbortSignal) { return this.call<null>("POST", `/forms/${encodeURIComponent(slug)}/unlock`, { password }, signal); }
  start(slug: string, body: { sessionId?: string; urlParams?: Record<string, string> } = {}, signal?: AbortSignal) {
    return this.call<{ submissionId: string; resumeToken: string }>("POST", `/forms/${encodeURIComponent(slug)}/submissions`, { action: "start", ...body }, signal);
  }
  save(slug: string, body: { submissionId: string; resumeToken: string; answers: Record<string, unknown> }, signal?: AbortSignal) {
    return this.call<{ submissionId: string; savedAt: number }>("POST", `/forms/${encodeURIComponent(slug)}/submissions`, { action: "save", ...body }, signal);
  }
  /** Headless decide for native rendering: show or not, which variant or journey step, resume and the published definition. Holdout answers `show: false`; excluded (outside traffic or targeting) answers `show: true` with the original form and no experiment id. */
  decide(body: DecideRequest, signal?: AbortSignal) { return this.call<DecideResult>("POST", "/onboarding/decide", body, signal); }
  /** Adaptive AI of a form that opted in. The server falls back to the author's static content on any trouble. */
  ai(slug: string, body: { action: "followup" | "classify" | "copy"; fieldId?: string; submissionId?: string; resumeToken?: string; answers: Record<string, unknown>; attributes?: Record<string, unknown>; targets?: string[] }, signal?: AbortSignal) {
    return this.call<Record<string, unknown>>("POST", `/forms/${encodeURIComponent(slug)}/ai`, body, signal);
  }
  /** Typed attributes and prefill from the form's profile lookup. */
  profile(slug: string, body: { uid?: string; uid_sig?: string; attributes?: Record<string, unknown> }, signal?: AbortSignal) {
    return this.call<{ attributes: Record<string, unknown>; known: Record<string, unknown> }>("POST", `/forms/${encodeURIComponent(slug)}/profile`, body, signal);
  }
  complete(slug: string, body: { answers: Record<string, unknown>; submissionId?: string; resumeToken?: string; urlParams?: Record<string, string>; idempotencyKey?: string }, signal?: AbortSignal) {
    return this.call<CompleteResult>("POST", `/forms/${encodeURIComponent(slug)}/submissions`, { action: "complete", ...body }, signal, body.idempotencyKey ? { "Idempotency-Key": body.idempotencyKey } : {});
  }
}
