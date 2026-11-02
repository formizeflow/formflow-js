import type { HttpClient, RequestOptions } from "../core";

type Json = Record<string, unknown>;
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "cancelled";
export type SigningInput = {
  title: string; message?: string; documentName: string;
  document: { kind: "text"; text: string } | { kind: "file"; fileId: string };
  signers: { name: string; email: string }[]; order?: "sequential" | "parallel"; expiresInDays?: number;
};

export type PortalInput = {
  name: string; slug?: string; audience?: string; description?: string; brand?: { logoUrl?: string; accent?: string; headline?: string };
  items: { formId: string; title?: string; dueInDays?: number }[]; requireInvite?: boolean; status?: "draft" | "published"; reminderAfterHours?: number | null; maxReminders?: number;
};

/** Approvals, e-signature requests, integration health and data sources. */
export class WorkflowsResource {
  constructor(private readonly h: HttpClient) {}

  readonly approvals = {
    list: (q: { status?: ApprovalStatus; mine?: boolean } = {}, o?: RequestOptions) => this.h.data<Json[]>("GET", "/approvals", { query: { status: q.status, mine: q.mine === undefined ? undefined : String(q.mine) }, ...o }),
    get: (id: string, o?: RequestOptions) => this.h.data<Json>("GET", `/approvals/${id}`, o),
    /** In-app decision: the signed-in user must be a current-stage approver. */
    decide: (id: string, body: { decision: "approved" | "rejected"; comment?: string }, o?: RequestOptions) => this.h.data<{ status: ApprovalStatus }>("POST", `/approvals/${id}/decision`, { body, ...o }),
    cancel: (id: string, o?: RequestOptions) => this.h.data<null>("POST", `/approvals/${id}/cancel`, { body: {}, ...o }),
    resend: (id: string, o?: RequestOptions) => this.h.data<{ sent: number }>("POST", `/approvals/${id}/resend`, { body: {}, ...o }),
  };

  /** Signature requests keep a tamper-evident audit trail. No compliance certification is claimed; legal validity depends on jurisdiction. */
  readonly signing = {
    list: (o?: RequestOptions) => this.h.data<Json[]>("GET", "/signing", o),
    /** Signer links are returned once. */
    create: (body: SigningInput, o?: RequestOptions) => this.h.data<Json>("POST", "/signing", { body, ...o }),
    get: (id: string, o?: RequestOptions) => this.h.data<Json>("GET", `/signing/${id}`, o),
    void: (id: string, o?: RequestOptions) => this.h.data<null>("POST", `/signing/${id}/void`, { body: {}, ...o }),
    verify: (id: string, o?: RequestOptions) => this.h.data<Json>("GET", `/signing/${id}/verify`, o),
    resendSigner: (id: string, signerId: string, o?: RequestOptions) => this.h.data<Json>("POST", `/signing/${id}/signers/${signerId}/resend`, { body: {}, ...o }),
    revokeSigner: (id: string, signerId: string, o?: RequestOptions) => this.h.data<null>("POST", `/signing/${id}/signers/${signerId}/revoke`, { body: {}, ...o }),
  };

  /** AI draft of a workflow from a plain-language description. Nothing is saved: review, then create. */
  readonly draft = (body: { description: string; formId?: string }, o?: RequestOptions) => this.h.data<{ draft: Json; warnings: string[]; provider: string }>("POST", "/workflows/draft", { body, ...o });
  /** Runs, failures, average duration and assignment statuses per step. */
  readonly stepReport = (workflowId: string, o?: RequestOptions) => this.h.data<Json[]>("GET", `/workflows/${workflowId}/step-report`, o);

  /** Tasks handed out by form_request, payment_request and sign steps. */
  readonly assignments = {
    list: (q: { workflowId?: string; status?: "pending" | "completed" | "overdue" | "cancelled"; email?: string; limit?: number } = {}, o?: RequestOptions) => this.h.data<Json[]>("GET", "/assignments", { query: q, ...o }),
    cancel: (id: string, o?: RequestOptions) => this.h.data<null>("POST", `/assignments/${id}/cancel`, { body: {}, ...o }),
  };

  /** Several forms for one audience behind a branded landing page at /p/<slug>. */
  readonly portals = {
    list: (o?: RequestOptions) => this.h.data<Json[]>("GET", "/portals", o),
    create: (body: PortalInput, o?: RequestOptions) => this.h.data<Json>("POST", "/portals", { body, ...o }),
    get: (id: string, o?: RequestOptions) => this.h.data<Json>("GET", `/portals/${id}`, o),
    update: (id: string, body: Partial<PortalInput>, o?: RequestOptions) => this.h.data<Json>("PATCH", `/portals/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/portals/${id}`, o),
    /** Emails personal links; they are returned once. */
    invite: (id: string, people: { email: string; name?: string }[], o?: RequestOptions) => this.h.data<{ email: string; url: string; emailed: boolean }[]>("POST", `/portals/${id}/invites`, { body: { people }, ...o }),
    progress: (id: string, o?: RequestOptions) => this.h.data<Json>("GET", `/portals/${id}/progress`, o),
  };

  /** Sandboxed custom-field widgets: use one in a `custom` field with component "widget" and config { widgetId, settings }. */
  readonly widgets = {
    list: (o?: RequestOptions) => this.h.data<Json[]>("GET", "/widgets", o),
    register: (manifest: Json, o?: RequestOptions) => this.h.data<Json>("POST", "/widgets", { body: manifest, ...o }),
    delete: (registrationId: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/widgets/${registrationId}`, o),
  };

  /** Browser-side answer encryption. Generate the key pair with generateKeyPair() from this SDK and keep the private key yourself. */
  readonly encryption = {
    enable: (formId: string, body: { publicKeyJwk: { kty: "RSA"; n: string; e: string }; fieldIds: string[]; keyId?: string }, o?: RequestOptions) => this.h.data<Json>("PUT", `/forms/${formId}/encryption`, { body, ...o }),
    disable: (formId: string, o?: RequestOptions) => this.h.data<Json>("DELETE", `/forms/${formId}/encryption`, o),
  };

  readonly integrations = {
    health: (o?: RequestOptions) => this.h.data<Json[]>("GET", "/integrations/health", o),
    /** Read-only test; providers that cannot be tested without sending data answer status "unchecked". */
    testConnection: (id: string, o?: RequestOptions) => this.h.data<Json>("POST", `/integrations/connections/${id}/test`, { body: {}, ...o }),
    /** Idempotent per failure state; `warnings` lists steps whose target cannot dedupe. */
    replay: (executionId: string, requestKey?: string, o?: RequestOptions) => this.h.data<Json>("POST", `/integrations/executions/${executionId}/replay`, { body: { requestKey }, ...o }),
  };

  readonly dataSources = {
    list: (formId?: string, o?: RequestOptions) => this.h.data<Json[]>("GET", "/data-sources", { query: { formId }, ...o }),
    create: (body: Json, o?: RequestOptions) => this.h.data<Json>("POST", "/data-sources", { body, ...o }),
    update: (id: string, body: Json, o?: RequestOptions) => this.h.data<Json>("PATCH", `/data-sources/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/data-sources/${id}`, o),
  };

  /** Workspace captcha keys. The secret is write-only. */
  readonly captcha = {
    status: (o?: RequestOptions) => this.h.data<Json>("GET", "/captcha", o),
    set: (body: { provider: "turnstile" | "hcaptcha" | "recaptcha_v2" | "recaptcha_v3"; siteKey: string; secret: string }, o?: RequestOptions) => this.h.data<Json>("PUT", "/captcha", { body, ...o }),
    clear: (o?: RequestOptions) => this.h.data<null>("DELETE", "/captcha", o),
  };
}
