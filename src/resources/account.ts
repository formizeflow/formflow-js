import type { HttpClient, ListParams, Page, RequestOptions } from "../core";
import type { ExportJob } from "./exports";

export type Me = {
  actor: { type: "user"; userId: string } | { type: "api_key"; keyId: string } | { type: "oauth"; tokenId: string; userId: string };
  /** null for interactive users; the granted permission list for API keys and OAuth tokens. */
  scopes: string[] | null; role: string; organizationId: string; workspace: { id: string; name?: string; slug?: string }; permissions: string[];
};
export type Member = { membershipId?: string; userId: string; email?: string; role: string; [k: string]: unknown };
export type MemberInvitation = { id: string; organizationId: string; workspaceId: string | null; email: string; role: string; invitedBy: string; expiresAt: number; acceptedAt?: number | null; createdAt: number };
export type ApiKeyRecord = { id: string; name: string; prefix: string; scopes: string[]; expiresAt: number | null; allowedIps?: string[] | null; lastUsedAt: number | null; revokedAt: number | null; createdAt: number };
export type FieldTypeInfo = { type: string; label: string; category: string; icon: string; isInput: boolean; supportsChoices: boolean };
export type MediaCheck = { ok: boolean; url: string; kind?: "image" | "video"; contentType?: string; bytes?: number; problems: string[] };
export type AuditEvent = { id: string; action: string; actorType: string; actorId: string; actorName: string | null; resourceType: string; resourceId: string | null; metadata: Record<string, unknown> | null; createdAt: number };

export class AccountResource {
  constructor(private readonly h: HttpClient) {}
  me(o?: RequestOptions) { return this.h.data<Me>("GET", "/me", o); }
  fieldTypes(o?: RequestOptions) { return this.h.data<{ categories: { id: string; label: string }[]; types: FieldTypeInfo[] }>("GET", "/field-types", o); }
  usage(period?: string, o?: RequestOptions) { return this.h.data<{ scope: "organization"; period: string; usage: Record<string, number>; entitlements: Record<string, unknown> }>("GET", "/usage", { query: { period }, ...o }); }
  /** Check a URL before using it as `Media.url`: reachable, public, image/video, size limits. */
  validateMedia(url: string, kind?: "image" | "video", o?: RequestOptions) { return this.h.data<MediaCheck>("POST", "/media/validate", { body: { url, kind }, ...o }); }

  readonly members = {
    list: (o?: RequestOptions) => this.h.data<Member[]>("GET", "/members", o),
    invite: (body: { email: string; role: string }, o?: RequestOptions) => this.h.data<MemberInvitation>("POST", "/members", { body, ...o }),
    setRole: (membershipId: string, role: string, o?: RequestOptions) => this.h.data<Member>("PATCH", `/members/${membershipId}`, { body: { role }, ...o }),
    /** `transferTo` (a user id) takes over the leaver's forms, views, schedules and templates. */
    remove: (membershipId: string, transferTo?: string, o?: RequestOptions) => this.h.data<{ transferred?: Record<string, number> } | null>("DELETE", `/members/${membershipId}`, { query: { transferTo }, ...o }),
  };
  readonly apiKeys = {
    list: (o?: RequestOptions) => this.h.data<ApiKeyRecord[]>("GET", "/api-keys", o),
    /** The full `key` is returned once. */
    create: (body: { name: string; scopes: string[]; expiresAt?: number; allowedIps?: string[] }, o?: RequestOptions) => this.h.data<ApiKeyRecord & { key: string }>("POST", "/api-keys", { body, ...o }),
    /** Org owners/admins: mint a key bound to another workspace of the organization. The full `key` is returned once. */
    createForWorkspace: (workspaceId: string, body: { name: string; scopes: string[]; expiresAt?: number; allowedIps?: string[] }, o?: RequestOptions) => this.h.data<ApiKeyRecord & { key: string }>("POST", `/workspaces/${workspaceId}/api-keys`, { body, ...o }),
    revoke: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/api-keys/${id}`, o),
  };
  /** The workspace's signed-uid secret (uid_sig = HMAC-SHA256(secret, uid)). `secret` is returned only on create or `rotate: true`. */
  readonly identity = {
    get: (o?: RequestOptions) => this.h.data<{ configured: boolean; requireSigned: boolean; atlasIssuer: string | null }>("GET", "/workspace/identity", o),
    /** atlasIssuer: https issuer whose Atlas session tokens prove a uid (`atlas_token`); null clears it. */
    update: (body: { requireSigned?: boolean; rotate?: boolean; atlasIssuer?: string | null }, o?: RequestOptions) => this.h.data<{ configured: boolean; requireSigned: boolean; atlasIssuer: string | null; secret?: string }>("PUT", "/workspace/identity", { body, ...o }),
  };
  readonly auditEvents = {
    list: (q?: ListParams & { action?: string; resourceType?: string; resourceId?: string; actorId?: string; actorType?: "user" | "api_key" | "oauth" | "system"; from?: number; to?: number }, o?: RequestOptions): Promise<Page<AuditEvent>> => this.h.page<AuditEvent>("/audit-events", q, o),
    listAll: (q?: ListParams & { action?: string; resourceType?: string; resourceId?: string; actorId?: string; actorType?: "user" | "api_key" | "oauth" | "system"; from?: number; to?: number }, o?: RequestOptions) => this.h.paginate<AuditEvent>("/audit-events", q, o),
    /** Across every workspace of the organization. Org owners and admins only. */
    listOrg: (q?: ListParams & { action?: string; resourceType?: string; resourceId?: string; actorId?: string; actorType?: "user" | "api_key" | "oauth" | "system"; from?: number; to?: number }, o?: RequestOptions): Promise<Page<AuditEvent>> => this.h.page<AuditEvent>("/org/audit-events", q, o),
    /** Start a CSV or JSON export of the audit log. Poll with `exports.get`. */
    export: (body: { format?: "csv" | "json"; scope?: "workspace" | "org"; action?: string; resourceType?: string; from?: number; to?: number }, o?: RequestOptions) => this.h.data<ExportJob>("POST", "/audit-events/export", { body, ...o }),
  };
}
