import type { HttpClient, RequestOptions } from "../core";
import type { Choice, FieldDefinition, Section } from "./definition";

export type OptionList = { id: string; name: string; choices: Choice[]; createdAt: number; updatedAt: number };
export type SavedBlock = { id: string; kind: "field" | "section"; name: string; payload: { field: FieldDefinition } | { section: Section; fields: FieldDefinition[] }; createdAt: number };
export type CommunityTemplate = { id: string; title: string; description: string | null; category: string | null; status: "pending" | "approved" | "rejected"; fields: number; createdAt: number; reviewNote?: string | null };
export type RecordingInfo = { fieldId: string; fileId: string; transcript: string | null; consent: boolean; shareUrl: string | null };

/** Workspace library: shared option lists, saved fields and sections, community templates and recorded answers. */
export class LibraryResource {
  constructor(private readonly h: HttpClient) {}
  readonly optionLists = {
    list: (o?: RequestOptions) => this.h.data<OptionList[]>("GET", "/option-lists", o),
    get: (id: string, o?: RequestOptions) => this.h.data<OptionList>("GET", `/option-lists/${id}`, o),
    create: (body: { name: string; choices: Choice[] }, o?: RequestOptions) => this.h.data<OptionList>("POST", "/option-lists", { body, ...o }),
    update: (id: string, body: { name?: string; choices?: Choice[] }, o?: RequestOptions) => this.h.data<OptionList>("PATCH", `/option-lists/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/option-lists/${id}`, o),
  };
  readonly savedBlocks = {
    list: (q: { kind?: "field" | "section" } = {}, o?: RequestOptions) => this.h.data<SavedBlock[]>("GET", "/saved-blocks", { query: q, ...o }),
    /** Copy a field or section out of a form (formId + fieldId or sectionId), or pass a payload. */
    save: (body: { name: string; kind: "field" | "section"; formId?: string; fieldId?: string; sectionId?: string; payload?: Record<string, unknown> }, o?: RequestOptions) => this.h.data<SavedBlock>("POST", "/saved-blocks", { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/saved-blocks/${id}`, o),
    insert: (formId: string, body: { blockId: string; sectionId?: string; index?: number; expectedRevision?: number }, o?: RequestOptions) => this.h.data<{ form: unknown; inserted: { fieldIds: string[]; sectionId?: string } }>("POST", `/forms/${formId}/insert-block`, { body, ...o }),
  };
  readonly community = {
    list: (o?: RequestOptions) => this.h.data<CommunityTemplate[]>("GET", "/community-templates", o),
    mine: (o?: RequestOptions) => this.h.data<CommunityTemplate[]>("GET", "/community-templates/mine", o),
    submit: (body: { formId: string; title: string; description?: string; category?: string }, o?: RequestOptions) => this.h.data<CommunityTemplate>("POST", "/community-templates", { body, ...o }),
    use: (id: string, name?: string, o?: RequestOptions) => this.h.data<unknown>("POST", `/community-templates/${id}/use`, { body: { name }, ...o }),
    /** Platform administrators. */
    queue: (status?: "pending" | "approved" | "rejected", o?: RequestOptions) => this.h.data<unknown[]>("GET", "/community-templates/moderation", { query: { status }, ...o }),
    moderate: (id: string, body: { status: "approved" | "rejected" | "pending"; note?: string }, o?: RequestOptions) => this.h.data<unknown>("PATCH", `/community-templates/${id}`, { body, ...o }),
  };
  readonly recordings = {
    list: (submissionId: string, o?: RequestOptions) => this.h.data<RecordingInfo[]>("GET", `/submissions/${submissionId}/recordings`, o),
    transcribe: (submissionId: string, force?: boolean, o?: RequestOptions) => this.h.data<{ transcripts: Record<string, string> }>("POST", `/submissions/${submissionId}/transcribe`, { body: { force }, ...o }),
    /** Needs the respondent's consent (field.reuseConsentFieldId). Returns the public player url and an iframe snippet. */
    share: (submissionId: string, fileId: string, o?: RequestOptions) => this.h.data<{ url: string; iframe: string }>("POST", `/submissions/${submissionId}/recordings/${fileId}/share`, o),
    unshare: (submissionId: string, fileId: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/submissions/${submissionId}/recordings/${fileId}/share`, o),
  };
}
