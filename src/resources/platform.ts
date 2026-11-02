import type { HttpClient, RequestOptions } from "../core";

type Json = Record<string, unknown>;
export type Folder = { id: string; name: string; parentId: string | null; workspaceId: string; createdAt: number };
export type CustomDomain = { id: string; hostname: string; status: string; [k: string]: unknown };
export type IntegrationConnection = { id: string; provider: string; name: string; status: string; scopes: string[]; lastError: string | null; createdAt: number };
export type MediaAsset = { id: string; kind: "image" | "video" | "font"; name: string; mime: string; size: number; alt: string | null; decorative: boolean; url: string; createdAt: number };
export type WorkflowBody = { name: string; formId?: string | null; trigger?: string; /** 5-field UTC cron, for trigger "schedule" */ schedule?: string | null; condition?: Json | null; steps: Json[]; enabled?: boolean };
export type Workflow = WorkflowBody & { id: string; createdAt: number; updatedAt: number };

/** Workspace structure and automation setup: folders, custom domains, media, integration connections and workflows. */
export class PlatformResource {
  constructor(private readonly h: HttpClient) {}

  readonly workspaces = {
    list: (o?: RequestOptions) => this.h.data<Json[]>("GET", "/workspaces", o),
    create: (body: { name: string; slug?: string }, o?: RequestOptions) => this.h.data<Json>("POST", "/workspaces", { body, ...o }),
  };

  readonly folders = {
    list: (o?: RequestOptions) => this.h.data<Folder[]>("GET", "/folders", o),
    create: (body: { name: string; parentId?: string | null }, o?: RequestOptions) => this.h.data<Folder>("POST", "/folders", { body, ...o }),
    update: (id: string, body: { name?: string; parentId?: string | null }, o?: RequestOptions) => this.h.data<Folder>("PATCH", `/folders/${id}`, { body, ...o }),
    /** Forms inside move to the root. */
    delete: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/folders/${id}`, o),
  };

  readonly domains = {
    list: (o?: RequestOptions) => this.h.data<CustomDomain[]>("GET", "/domains", o),
    /** Returns the DNS records to create; then call `verify`. */
    add: (hostname: string, o?: RequestOptions) => this.h.data<CustomDomain>("POST", "/domains", { body: { hostname }, ...o }),
    verify: (id: string, o?: RequestOptions) => this.h.data<CustomDomain>("POST", `/domains/${id}/verify`, { body: {}, ...o }),
    remove: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/domains/${id}`, o),
  };

  readonly media = {
    list: (q: { search?: string; kind?: "image" | "video" | "font"; cursor?: number } = {}, o?: RequestOptions) => this.h.data<{ data: MediaAsset[]; nextCursor?: number | null }>("GET", "/media", { query: q, ...o }),
    /** Upload from base64 (about 1.3 MB of file) or have the server fetch a public `fromUrl`. Returns a stable `url`. Larger files: multipart POST /api/media. */
    upload: (body: { filename: string; contentBase64?: string; fromUrl?: string; alt?: string; decorative?: boolean }, o?: RequestOptions) => this.h.data<MediaAsset>("POST", "/media", { body, ...o }),
    /** Upload bytes you hold (Uint8Array). */
    uploadBytes: (filename: string, bytes: Uint8Array, meta: { alt?: string; decorative?: boolean } = {}, o?: RequestOptions) =>
      this.h.data<MediaAsset>("POST", "/media", { body: { filename, contentBase64: btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join("")), ...meta }, ...o }),
  };

  readonly integrations = {
    /** Providers with credential fields and action schemas. */
    providers: (o?: RequestOptions) => this.h.data<Json[]>("GET", "/integrations/providers", o),
    connections: {
      list: (o?: RequestOptions) => this.h.data<IntegrationConnection[]>("GET", "/integrations/connections", o),
      /** API-key and webhook-URL providers. OAuth providers connect in the app. Credentials are never returned. */
      create: (body: { provider: string; name: string; credentials: Record<string, string | number> }, o?: RequestOptions) => this.h.data<IntegrationConnection>("POST", "/integrations/connections", { body, ...o }),
      update: (id: string, body: { name?: string; credentials?: Record<string, string | number> }, o?: RequestOptions) => this.h.data<IntegrationConnection>("PATCH", `/integrations/connections/${id}`, { body, ...o }),
      delete: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/integrations/connections/${id}`, o),
      test: (id: string, o?: RequestOptions) => this.h.data<Json>("POST", `/integrations/connections/${id}/test`, { body: {}, ...o }),
    },
  };

  readonly workflows = {
    list: (formId?: string, o?: RequestOptions) => this.h.data<Workflow[]>("GET", "/workflows", { query: { formId }, ...o }),
    get: (id: string, o?: RequestOptions) => this.h.data<Workflow>("GET", `/workflows/${id}`, o),
    create: (body: WorkflowBody, o?: RequestOptions) => this.h.data<Workflow>("POST", "/workflows", { body, ...o }),
    update: (id: string, body: Partial<WorkflowBody>, o?: RequestOptions) => this.h.data<Workflow>("PATCH", `/workflows/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/workflows/${id}`, o),
    executions: (id: string, o?: RequestOptions) => this.h.data<Json[]>("GET", `/workflows/${id}/executions`, o),
  };
}
