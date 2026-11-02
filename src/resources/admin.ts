import type { HttpClient, Page, RequestOptions } from "../core";

export type Permission = string;
export type FormAccessMode = "anyone" | "domains" | "contact_list" | "members" | "login";
export type FormAccess = { formId: string; mode: FormAccessMode; domains: string[]; listId: string | null; ipAllow: string[]; ipDeny: string[] };
export type OrgSecurity = { require2fa: boolean; idleTimeoutMinutes: number | null; ipAllow: string[]; ipDeny: string[] };
export type BrandKit = { mode: "suggested" | "enforced"; logoUrl: string | null; themes: { id: string; name: string; definition: Record<string, unknown> }[]; defaultThemeId: string | null; formDefaults: Record<string, unknown> };
export type JoinDomain = { domain: string; verifiedAt: number | null; dnsName: string; dnsValue: string };
export type DomainJoin = { requireApproval: boolean; defaultRole: "viewer" | "analyst" | "editor" | "developer"; domains: JoinDomain[] };
export type CustomRole = { id: string; name: string; description: string | null; permissions: Permission[]; members?: number; createdAt: number; updatedAt: number };
export type UserGroup = { id: string; name: string; members?: { userId: string; email: string }[]; createdAt: number };
export type AccessGrant = { id: string; workspaceId: string; principalType: "user" | "group"; principalId: string; scopeType: "folder" | "form" | "view"; scopeId: string; createdAt: number };
export type TeamTemplate = { id: string; name: string; description: string | null; orgWide: boolean; isDefault: boolean; fields: number; workspaceId: string; createdAt: number };
export type EmailEvent = { id: string; email: string; event: "sent" | "delivered" | "bounce" | "complaint"; provider: string; detail: string | null; createdAt: number };

/** Access, admin and organization settings. Organization-level calls need an organization owner or admin. */
export class AdminResource {
  constructor(private readonly h: HttpClient) {}

  /** Who may open and answer a published form, plus per-form IP lists. */
  readonly formAccess = {
    get: (formId: string, o?: RequestOptions) => this.h.data<FormAccess>("GET", `/forms/${formId}/access`, o),
    set: (formId: string, body: { mode: FormAccessMode; domains?: string[]; listId?: string; ipAllow?: string[]; ipDeny?: string[] }, o?: RequestOptions) => this.h.data<FormAccess>("PUT", `/forms/${formId}/access`, { body, ...o }),
  };
  readonly tags = {
    list: (o?: RequestOptions) => this.h.data<{ tag: string; forms: number }[]>("GET", "/tags", o),
    get: (formId: string, o?: RequestOptions) => this.h.data<string[]>("GET", `/forms/${formId}/tags`, o),
    set: (formId: string, tags: string[], o?: RequestOptions) => this.h.data<string[]>("PUT", `/forms/${formId}/tags`, { body: { tags }, ...o }),
  };
  /** Move (not copy) a form with its responses to another workspace of the same organization. */
  moveForm(formId: string, workspaceId: string, opts: { detachConfig?: boolean } = {}, o?: RequestOptions) {
    return this.h.data<{ form: unknown; detached: Record<string, number> }>("POST", `/forms/${formId}/move`, { body: { workspaceId, ...opts }, ...o });
  }
  /** Team template library. */
  readonly templates = {
    list: (o?: RequestOptions) => this.h.data<TeamTemplate[]>("GET", "/workspace-templates", o),
    get: (id: string, o?: RequestOptions) => this.h.data<TeamTemplate & { definition: unknown }>("GET", `/workspace-templates/${id}`, o),
    save: (body: { name: string; description?: string; formId?: string; definition?: Record<string, unknown>; orgWide?: boolean; isDefault?: boolean }, o?: RequestOptions) => this.h.data<TeamTemplate>("POST", "/workspace-templates", { body, ...o }),
    update: (id: string, body: { name?: string; description?: string | null; isDefault?: boolean; orgWide?: boolean; formId?: string }, o?: RequestOptions) => this.h.data<TeamTemplate>("PATCH", `/workspace-templates/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/workspace-templates/${id}`, o),
    use: (id: string, body: { name?: string; folderId?: string } = {}, o?: RequestOptions) => this.h.data<unknown>("POST", `/workspace-templates/${id}/use`, { body, ...o }),
  };
  /** Workspace default theme (preset id or saved theme id; null clears it). */
  setDefaultTheme(defaultThemeId: string | null, o?: RequestOptions) { return this.h.data<{ id: string; defaultThemeId: string | null }>("PATCH", "/workspaces/current", { body: { defaultThemeId }, ...o }); }

  readonly security = {
    get: (o?: RequestOptions) => this.h.data<OrgSecurity>("GET", "/org/security", o),
    update: (body: Partial<{ require2fa: boolean; idleTimeoutMinutes: number | null; ipAllow: string[]; ipDeny: string[] }>, o?: RequestOptions) => this.h.data<OrgSecurity>("PUT", "/org/security", { body, ...o }),
  };
  readonly brandKit = {
    get: (o?: RequestOptions) => this.h.data<BrandKit>("GET", "/org/brand-kit", o),
    set: (body: Partial<Omit<BrandKit, "themes">> & { themes?: { id?: string; name: string; definition: Record<string, unknown> }[] }, o?: RequestOptions) => this.h.data<BrandKit>("PUT", "/org/brand-kit", { body, ...o }),
  };
  /** Domain-enforced account join: claim a domain, publish the TXT record, verify; members of the domain join automatically or after approval. */
  readonly domainJoin = {
    get: (o?: RequestOptions) => this.h.data<DomainJoin>("GET", "/org/domain-join", o),
    update: (body: { requireApproval?: boolean; defaultRole?: DomainJoin["defaultRole"] }, o?: RequestOptions) => this.h.data<DomainJoin>("PATCH", "/org/domain-join", { body, ...o }),
    addDomain: (domain: string, o?: RequestOptions) => this.h.data<DomainJoin>("POST", "/org/domain-join/domains", { body: { domain }, ...o }),
    verifyDomain: (domain: string, o?: RequestOptions) => this.h.data<DomainJoin>("POST", "/org/domain-join/domains/verify", { body: { domain }, ...o }),
    removeDomain: (domain: string, o?: RequestOptions) => this.h.data<DomainJoin>("DELETE", "/org/domain-join/domains", { query: { domain }, ...o }),
    requests: (status?: "pending" | "approved" | "rejected", o?: RequestOptions) => this.h.data<{ id: string; userId: string; email: string; status: string; createdAt: number }[]>("GET", "/org/join-requests", { query: { status }, ...o }),
    decide: (id: string, decision: "approve" | "reject", o?: RequestOptions) => this.h.data<{ id: string; status: string }>("POST", `/org/join-requests/${id}`, { body: { decision }, ...o }),
  };
  readonly roles = {
    list: (o?: RequestOptions) => this.h.data<CustomRole[]>("GET", "/org/roles", o),
    create: (body: { name: string; description?: string; permissions: Permission[] }, o?: RequestOptions) => this.h.data<CustomRole>("POST", "/org/roles", { body, ...o }),
    update: (id: string, body: { name?: string; description?: string; permissions?: Permission[] }, o?: RequestOptions) => this.h.data<CustomRole>("PATCH", `/org/roles/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/org/roles/${id}`, o),
    /** Give a member a custom role (null removes it) and/or make them a guest limited to grants. */
    assign: (membershipId: string, body: { customRoleId?: string | null; guest?: boolean }, o?: RequestOptions) => this.h.data<{ membershipId: string; customRoleId: string | null; guest: boolean }>("PUT", `/org/members/${membershipId}/access`, { body, ...o }),
  };
  readonly groups = {
    list: (o?: RequestOptions) => this.h.data<UserGroup[]>("GET", "/org/groups", o),
    create: (name: string, o?: RequestOptions) => this.h.data<UserGroup>("POST", "/org/groups", { body: { name }, ...o }),
    rename: (id: string, name: string, o?: RequestOptions) => this.h.data<UserGroup>("PATCH", `/org/groups/${id}`, { body: { name }, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/org/groups/${id}`, o),
    setMembers: (id: string, userIds: string[], o?: RequestOptions) => this.h.data<{ groupId: string; userIds: string[] }>("PUT", `/org/groups/${id}/members`, { body: { userIds }, ...o }),
  };
  readonly grants = {
    list: (q: { workspaceId?: string; principalId?: string } = {}, o?: RequestOptions) => this.h.data<AccessGrant[]>("GET", "/org/grants", { query: q, ...o }),
    create: (body: { workspaceId: string; principalType: "user" | "group"; principalId: string; scopeType: "folder" | "form" | "view"; scopeId: string }, o?: RequestOptions) => this.h.data<AccessGrant>("POST", "/org/grants", { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/org/grants/${id}`, o),
  };
  /** Remove a member; transferTo hands over their forms, views, schedules and templates. */
  removeMember(membershipId: string, transferTo?: string, o?: RequestOptions) { return this.h.data<{ transferred?: Record<string, number> } | void>("DELETE", `/members/${membershipId}`, { query: { transferTo }, ...o }); }
  /** Email delivery log. */
  emailLog(q: { event?: EmailEvent["event"]; email?: string; cursor?: string; limit?: number } = {}, o?: RequestOptions): Promise<Page<EmailEvent>> { return this.h.page<EmailEvent>("/org/email-log", q, o); }

  /** Partner and reseller provisioning. */
  readonly partner = {
    setStatus: (organizationId: string, enabled: boolean, o?: RequestOptions) => this.h.data<{ organizationId: string; partner: boolean }>("PUT", "/org/partner", { body: { organizationId, enabled }, ...o }),
    organizations: {
      list: (o?: RequestOptions) => this.h.data<{ id: string; name: string; slug: string; createdAt: number }[]>("GET", "/org/partner/organizations", o),
      create: (body: { name: string; workspaceName?: string; dataRegion?: string }, o?: RequestOptions) => this.h.data<{ organization: { id: string; name: string; slug: string }; workspace: { id: string; name: string; slug: string } }>("POST", "/org/partner/organizations", { body, ...o }),
      delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/org/partner/organizations/${id}`, o),
      createWorkspace: (id: string, name: string, o?: RequestOptions) => this.h.data<{ id: string; name: string; slug: string; organizationId: string }>("POST", `/org/partner/organizations/${id}/workspaces`, { body: { name }, ...o }),
    },
    keys: {
      list: (organizationId: string, workspaceId: string, o?: RequestOptions) => this.h.data<unknown[]>("GET", `/org/partner/organizations/${organizationId}/keys`, { query: { workspaceId }, ...o }),
      /** The secret is returned once in `key`. */
      issue: (organizationId: string, body: { workspaceId: string; name: string; scopes: Permission[]; expiresAt?: number }, o?: RequestOptions) => this.h.data<{ key: string; id: string }>("POST", `/org/partner/organizations/${organizationId}/keys`, { body, ...o }),
      revoke: (organizationId: string, workspaceId: string, keyId: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/org/partner/organizations/${organizationId}/keys/${keyId}`, { query: { workspaceId }, ...o }),
    },
  };
}
