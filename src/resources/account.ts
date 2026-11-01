import type { HttpClient, ListParams, Page, RequestOptions } from "../core";

export type Me = {
  actor: { type: "user"; userId: string } | { type: "api_key"; keyId: string } | { type: "oauth"; tokenId: string; userId: string };
  /** null for interactive users; the granted permission list for API keys and OAuth tokens. */
  scopes: string[] | null; role: string; organizationId: string; workspace: { id: string; name?: string; slug?: string }; permissions: string[];
};
export type Member = { membershipId?: string; userId: string; email?: string; role: string; [k: string]: unknown };
export type ApiKeyRecord = { id: string; name: string; prefix: string; scopes: string[]; expiresAt: number | null; lastUsedAt: number | null; revokedAt: number | null; createdAt: number };
export type FieldTypeInfo = { type: string; label: string; category: string; icon: string; isInput: boolean; supportsChoices: boolean };
export type MediaCheck = { ok: boolean; url: string; kind?: "image" | "video"; contentType?: string; bytes?: number; problems: string[] };
export type AuditEvent = { id: string; action: string; actorType: string; actorId: string; resourceType: string; resourceId: string | null; metadata: Record<string, unknown> | null; createdAt: number };

export class AccountResource {
  constructor(private readonly h: HttpClient) {}
  me(o?: RequestOptions) { return this.h.data<Me>("GET", "/me", o); }
  fieldTypes(o?: RequestOptions) { return this.h.data<{ categories: { id: string; label: string }[]; types: FieldTypeInfo[] }>("GET", "/field-types", o); }
  usage(period?: string, o?: RequestOptions) { return this.h.data<{ period: string; usage: Record<string, number>; entitlements: Record<string, unknown> }>("GET", "/usage", { query: { period }, ...o }); }
  /** Check a URL before using it as `Media.url`: reachable, public, image/video, size limits. */
  validateMedia(url: string, kind?: "image" | "video", o?: RequestOptions) { return this.h.data<MediaCheck>("POST", "/media/validate", { body: { url, kind }, ...o }); }

  readonly members = {
    list: (o?: RequestOptions) => this.h.data<Member[]>("GET", "/members", o),
    invite: (body: { email: string; role: string }, o?: RequestOptions) => this.h.data<Member>("POST", "/members", { body, ...o }),
    setRole: (membershipId: string, role: string, o?: RequestOptions) => this.h.data<Member>("PATCH", `/members/${membershipId}`, { body: { role }, ...o }),
    remove: (membershipId: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/members/${membershipId}`, o),
  };
  readonly apiKeys = {
    list: (o?: RequestOptions) => this.h.data<ApiKeyRecord[]>("GET", "/api-keys", o),
    /** The full `key` is returned once. */
    create: (body: { name: string; scopes: string[]; expiresAt?: number }, o?: RequestOptions) => this.h.data<ApiKeyRecord & { key: string }>("POST", "/api-keys", { body, ...o }),
    revoke: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/api-keys/${id}`, o),
  };
  readonly auditEvents = {
    list: (q?: ListParams & { action?: string; resourceType?: string; from?: number; to?: number }, o?: RequestOptions): Promise<Page<AuditEvent>> => this.h.page<AuditEvent>("/audit-events", q, o),
    listAll: (q?: ListParams & { action?: string; resourceType?: string; from?: number; to?: number }, o?: RequestOptions) => this.h.paginate<AuditEvent>("/audit-events", q, o),
  };
}
