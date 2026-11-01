import type { HttpClient, RequestOptions } from "../core";
import type { Condition } from "./definition";

type Json = Record<string, unknown>;
export type TriageStatus = "new" | "in_review" | "approved" | "rejected" | "done";
export type TriageRecord = { status: TriageStatus; assigneeId: string | null; tags: string[]; updatedAt: number };
export type TriageMap = { items: Record<string, TriageRecord>; assignees: { userId: string; name: string | null; email: string }[] };
export type TriagePatch = { status?: TriageStatus; assigneeId?: string | null; tags?: string[] };
export type ShareMode = "aggregate" | "respondents";
export type ShareLinkInput = {
  name: string; password?: string | null; expiresInDays?: number | null;
  config?: { mode?: ShareMode; fieldIds?: string[]; filters?: Condition; windowDays?: number; showMetrics?: boolean };
};
/** `url` is a bearer capability: store it like a credential. */
export type ShareLink = { id: string; formId: string; name: string; state: "active" | "expired" | "revoked"; passwordProtected: boolean; expiresAt: number | null; url: string | null; config: Json };
export type Invitation = { id: string; formId: string; email: string | null; singleUse: boolean; expiresAt: number | null; usedAt?: number | null; revokedAt?: number | null; [k: string]: unknown };
export type InvitationInput = { invitations: { email?: string; attributes?: Record<string, string> }[]; expiresInDays?: number; singleUse?: boolean; send?: boolean };

/** Results workbench: triage, corrections, spam, invitations, share links and version history. */
export class ResultsResource {
  constructor(private readonly h: HttpClient) {}

  triage(formId: string, o?: RequestOptions) { return this.h.data<TriageMap>("GET", `/forms/${formId}/triage`, o); }
  setTriage(submissionId: string, patch: TriagePatch, o?: RequestOptions) { return this.h.data<TriageRecord>("PATCH", `/submissions/${submissionId}/triage`, { body: patch, ...o }); }
  bulkTriage(body: { ids: string[]; status?: TriageStatus; assigneeId?: string | null; addTags?: string[]; removeTags?: string[] }, o?: RequestOptions) { return this.h.data<{ updated: number }>("POST", "/submissions/bulk-triage", { body, ...o }); }

  /** Edit history of a response; the original value of every correction stays recoverable. */
  edits(submissionId: string, o?: RequestOptions) { return this.h.data<Json[]>("GET", `/submissions/${submissionId}/edits`, o); }
  editAnswer(submissionId: string, body: { fieldId: string; value: unknown; reason?: string }, o?: RequestOptions) { return this.h.data<Json>("POST", `/submissions/${submissionId}/edits`, { body, ...o }); }
  revertEdit(submissionId: string, editId: string, o?: RequestOptions) { return this.h.data<Json>("POST", `/submissions/${submissionId}/edits/${editId}/revert`, { body: {}, ...o }); }

  markSpam(submissionId: string, o?: RequestOptions) { return this.h.data<Json>("POST", `/submissions/${submissionId}/spam`, { body: {}, ...o }); }
  /** Spam to completed; completion events, webhooks and notifications fire now. */
  restoreFromSpam(submissionId: string, o?: RequestOptions) { return this.h.data<Json>("POST", `/submissions/${submissionId}/restore`, { body: {}, ...o }); }

  readonly invitations = {
    list: (formId: string, o?: RequestOptions) => this.h.data<Invitation[]>("GET", `/forms/${formId}/invitations`, o),
    /** Each token and link is returned once; only a hash is stored. */
    create: (formId: string, body: InvitationInput, o?: RequestOptions) => this.h.data<Json>("POST", `/forms/${formId}/invitations`, { body, ...o }),
    revoke: (formId: string, invitationId: string, o?: RequestOptions) => this.h.data<Json>("DELETE", `/forms/${formId}/invitations/${invitationId}`, o),
  };

  readonly shareLinks = {
    list: (formId: string, o?: RequestOptions) => this.h.data<ShareLink[]>("GET", `/forms/${formId}/share-links`, o),
    create: (formId: string, body: ShareLinkInput, o?: RequestOptions) => this.h.data<ShareLink>("POST", `/forms/${formId}/share-links`, { body, ...o }),
    revoke: (linkId: string, o?: RequestOptions) => this.h.data<ShareLink>("DELETE", `/share-links/${linkId}`, o),
  };

  readonly versions = {
    history: (formId: string, o?: RequestOptions) => this.h.data<Json>("GET", `/forms/${formId}/version-history`, o),
    /** `from` and `to` are version numbers or "draft". */
    compare: (formId: string, from: number | "draft", to: number | "draft", o?: RequestOptions) => this.h.data<{ lines: string[]; more: number; destructive: number; total: number }>("GET", `/forms/${formId}/versions/compare`, { query: { from, to }, ...o }),
    /** Replaces the draft; the previous draft is snapshotted first. The live form is unchanged until publish. */
    restore: (formId: string, version: number, o?: RequestOptions) => this.h.data<Json>("POST", `/forms/${formId}/versions/${version}/restore`, { body: {}, ...o }),
    undoRestore: (formId: string, snapshotId: string, o?: RequestOptions) => this.h.data<Json>("POST", `/forms/${formId}/restores/${snapshotId}/undo`, { body: {}, ...o }),
  };
}
