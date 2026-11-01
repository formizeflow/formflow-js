import type { HttpClient, ListParams, Page, RequestOptions } from "../core";
import type { DefinitionIssue, FieldDefinition, FormDefinition, Section, LogicRule, ThemeOverrides, Ending, Welcome, FormSettings } from "./definition";

export type FormStatus = "draft" | "published" | "closed" | "archived" | "deleted";
export type Form = {
  id: string; workspaceId: string; name: string; slug: string; description: string | null; status: FormStatus;
  /** Editable draft. `settings.passwordHash` is never present. */
  draft: FormDefinition; draftRevision: number; publishedVersionId: string | null;
  themeId: string | null; folderId: string | null;
  /** A password is set on the draft (write-only: set it with `forms.update(id, { password })`). */
  passwordRequired: boolean; createdAt: number; updatedAt: number;
};
export type FormVersion = { id: string; formId: string; version: number; definition?: FormDefinition; theme?: Record<string, unknown>; publishedBy: string; createdAt: number };
export type CreateFormInput = { name: string; definition?: FormDefinition; templateId?: string; folderId?: string; slug?: string };
export type UpdateFormInput = {
  name?: string; description?: string | null; slug?: string; themeId?: string | null; folderId?: string | null;
  /** Replaces the whole draft. Requires `expectedRevision` (409 conflict if the draft moved on). */
  definition?: FormDefinition; expectedRevision?: number;
  /** Write-only. Hashed server-side; `null` removes the password. Applies at the next publish. */
  password?: string | null;
};
export type ListFormsParams = ListParams & { status?: FormStatus; folderId?: string; q?: string };
export type PublishResult = { form: Form; version: FormVersion; warnings: DefinitionIssue[] };
export type ImportInput = { format: "formflow" | "typeform" | "csv"; data: unknown; name?: string; create?: boolean };
export type ImportResult = { definition: FormDefinition; report: { imported: number; unsupported: { item: string; reason: string }[] }; form?: Form };
export type ShareLinks = {
  formId: string; slug: string; published: boolean; passwordRequired: boolean;
  hostedUrl: string; embedUrl: string; qrUrl: string; qrSvgUrl: string;
  embed: { script: string; inline: string; popup: string; slider: string; fullscreen: string; iframe: string };
};

/** One edit in a batch (see `forms.operations`). Applied atomically, validated by the form engine. */
export type DraftOperation =
  | { op: "set_title"; title: string }
  | { op: "set_description"; description: string | null }
  | { op: "add_field"; field: FieldDefinition; sectionId?: string; index?: number }
  | { op: "update_field"; fieldId: string; patch: Partial<FieldDefinition> }
  | { op: "move_field"; fieldId: string; toIndex?: number; toSectionId?: string; toSectionIndex?: number }
  | { op: "delete_field"; fieldId: string }
  | { op: "add_section"; section: Section; index?: number }
  | { op: "update_section"; sectionId: string; patch: Partial<Section> }
  | { op: "delete_section"; sectionId: string }
  | { op: "set_theme"; theme: ThemeOverrides; replace?: boolean }
  | { op: "set_logic"; rules: LogicRule[] }
  | { op: "add_logic_rule"; rule: LogicRule }
  | { op: "delete_logic_rule"; ruleId: string }
  | { op: "set_settings"; settings: FormSettings }
  | { op: "set_welcome"; welcome: Welcome | null }
  | { op: "set_endings"; endings: Ending[] };
export type OperationsResult = { form: Form; applied: number; issues: DefinitionIssue[] };

export class FormsResource {
  constructor(private readonly h: HttpClient) {}

  list(q?: ListFormsParams, o?: RequestOptions): Promise<Page<Form>> { return this.h.page<Form>("/forms", q, o); }
  /** Async iterator over every form (auto-pagination). */
  listAll(q?: ListFormsParams, o?: RequestOptions) { return this.h.paginate<Form>("/forms", q, o); }
  get(id: string, o?: RequestOptions) { return this.h.data<Form>("GET", `/forms/${id}`, o); }
  create(body: CreateFormInput, o?: RequestOptions) { return this.h.data<Form>("POST", "/forms", { body, ...o }); }
  update(id: string, body: UpdateFormInput, o?: RequestOptions) { return this.h.data<Form>("PATCH", `/forms/${id}`, { body, ...o }); }
  delete(id: string, o?: RequestOptions) { return this.h.data<null>("DELETE", `/forms/${id}`, o); }
  /** Copy a form; pass `workspaceId` to copy into another workspace you can write to (user/OAuth credentials). */
  duplicate(id: string, body: { name?: string; workspaceId?: string } = {}, o?: RequestOptions) { return this.h.data<Form>("POST", `/forms/${id}/duplicate`, { body, ...o }); }
  archive(id: string, o?: RequestOptions) { return this.h.data<Form>("POST", `/forms/${id}/archive`, { body: {}, ...o }); }
  restore(id: string, o?: RequestOptions) { return this.h.data<Form>("POST", `/forms/${id}/restore`, { body: {}, ...o }); }
  /** Throws ValidationError whose `details.issues` lists the blocking problems. */
  publish(id: string, o?: RequestOptions) { return this.h.data<PublishResult>("POST", `/forms/${id}/publish`, { body: {}, ...o }); }
  versions(id: string, o?: RequestOptions) { return this.h.data<FormVersion[]>("GET", `/forms/${id}/versions`, o); }
  version(id: string, version: number, o?: RequestOptions) { return this.h.data<FormVersion>("GET", `/forms/${id}/versions/${version}`, o); }
  import(body: ImportInput, o?: RequestOptions) { return this.h.data<ImportResult>("POST", "/forms/import", { body, ...o }); }
  /** Hosted URL, QR code and embed snippets. */
  share(id: string, o?: RequestOptions) { return this.h.data<ShareLinks>("GET", `/forms/${id}/share`, o); }
  /** Atomic batch edit of the draft. */
  operations(id: string, operations: DraftOperation[], expectedRevision?: number, o?: RequestOptions) {
    return this.h.data<OperationsResult>("POST", `/forms/${id}/operations`, { body: { operations, expectedRevision }, ...o });
  }
  /** Convenience: edit with a callback that returns operations. */
  async edit(id: string, build: (form: Form) => DraftOperation[], o?: RequestOptions): Promise<OperationsResult> {
    const f = await this.get(id, o);
    return this.operations(id, build(f), f.draftRevision, o);
  }

  readonly fields = {
    list: (id: string, o?: RequestOptions) => this.h.data<FieldDefinition[]>("GET", `/forms/${id}/fields`, o),
    add: (id: string, body: { field: FieldDefinition; sectionId?: string; index?: number; expectedRevision?: number }, o?: RequestOptions) => this.h.data<{ field: FieldDefinition; draftRevision: number }>("POST", `/forms/${id}/fields`, { body, ...o }),
    update: (id: string, fieldId: string, patch: Partial<FieldDefinition> & { expectedRevision?: number }, o?: RequestOptions) => this.h.data<{ field: FieldDefinition; draftRevision: number }>("PATCH", `/forms/${id}/fields/${fieldId}`, { body: patch, ...o }),
    reorder: (id: string, fieldIds: string[], expectedRevision?: number, o?: RequestOptions) => this.h.data<{ draftRevision: number }>("POST", `/forms/${id}/fields/reorder`, { body: { fieldIds, expectedRevision }, ...o }),
    delete: (id: string, fieldId: string, o?: RequestOptions) => this.h.data<{ draftRevision: number }>("DELETE", `/forms/${id}/fields/${fieldId}`, o),
  };
  readonly sections = {
    list: (id: string, o?: RequestOptions) => this.h.data<Section[]>("GET", `/forms/${id}/sections`, o),
    add: (id: string, section: Section, o?: RequestOptions) => this.h.data<unknown>("POST", `/forms/${id}/sections`, { body: section, ...o }),
    update: (id: string, sectionId: string, patch: Partial<Section>, o?: RequestOptions) => this.h.data<unknown>("PATCH", `/forms/${id}/sections/${sectionId}`, { body: patch, ...o }),
    delete: (id: string, sectionId: string, o?: RequestOptions) => this.h.data<unknown>("DELETE", `/forms/${id}/sections/${sectionId}`, o),
  };
  readonly logic = {
    list: (id: string, o?: RequestOptions) => this.h.data<LogicRule[]>("GET", `/forms/${id}/logic`, o),
    add: (id: string, rule: LogicRule, o?: RequestOptions) => this.h.data<unknown>("POST", `/forms/${id}/logic`, { body: rule, ...o }),
    update: (id: string, ruleId: string, patch: Partial<LogicRule>, o?: RequestOptions) => this.h.data<unknown>("PATCH", `/forms/${id}/logic/${ruleId}`, { body: patch, ...o }),
    delete: (id: string, ruleId: string, o?: RequestOptions) => this.h.data<unknown>("DELETE", `/forms/${id}/logic/${ruleId}`, o),
  };
}
