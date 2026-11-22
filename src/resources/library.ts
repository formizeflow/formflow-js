import type { HttpClient, Page, RequestOptions } from "../core";
import type { Choice, FieldDefinition, Section } from "./definition";

export type OptionList = { id: string; name: string; choices: Choice[]; createdAt: number; updatedAt: number };
export type SavedBlock = { id: string; kind: "field" | "section"; name: string; payload: { field: FieldDefinition } | { section: Section; fields: FieldDefinition[] }; createdAt: number };
export type CommunityTemplate = { id: string; title: string; description: string | null; category: string | null; status: "pending" | "approved" | "rejected"; fields: number; createdAt: number; reviewNote?: string | null };
export type RecordingInfo = { fieldId: string; fileId: string; transcript: string | null; consent: boolean; shareUrl: string | null };

export type TableColumn = { id: string; name: string; type: "text" | "number" | "date" | "select" | "checkbox" | "link"; options?: string[]; tableId?: string };
export type WorkspaceTable = { id: string; name: string; columns: TableColumn[]; keyColumn?: string | null; rowCount?: number; createdAt: number; updatedAt: number };
export type TableRowFilter = { col: string; op: "eq" | "neq" | "contains" | "gt" | "gte" | "lt" | "lte" | "empty" | "notempty"; value?: string | number | boolean };
export type TableRowChange = { id: string; action: "create" | "update" | "delete"; changes: Record<string, [unknown, unknown]>; actor: string | null; createdAt: number };
export type TableRow = { id: string; data: Record<string, string | number | boolean | null>; createdAt: number; updatedAt: number };
export type LogicTestResult = { gate: "block" | "warn"; failed: number; results: { id: string; name: string; passed: boolean; failures: string[]; actual: { ending: string; path: string[]; visible: string[] } }[] };

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
    list: (q?: { q?: string; category?: string }, o?: RequestOptions) => this.h.data<CommunityTemplate[]>("GET", "/community-templates", { query: q, ...o }),
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
  /** Workspace tables not tied to a form. Forms read from them (data sources with tableId) and write to them (settings.tableWrite). */
  readonly tables = {
    list: (o?: RequestOptions) => this.h.data<WorkspaceTable[]>("GET", "/tables", o),
    get: (id: string, o?: RequestOptions) => this.h.data<WorkspaceTable>("GET", `/tables/${id}`, o),
    create: (body: { name: string; columns: TableColumn[]; keyColumn?: string | null }, o?: RequestOptions) => this.h.data<WorkspaceTable>("POST", "/tables", { body, ...o }),
    update: (id: string, body: { name?: string; columns?: TableColumn[]; keyColumn?: string | null }, o?: RequestOptions) => this.h.data<WorkspaceTable>("PATCH", `/tables/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/tables/${id}`, o),
    /** `sort` is `column:asc|desc`; `filters` run in SQL. */
    rows: (id: string, q: { q?: string; cursor?: string; limit?: number; sort?: string; filters?: TableRowFilter[] } = {}, o?: RequestOptions): Promise<Page<TableRow>> => this.h.page<TableRow>(`/tables/${id}/rows`, { ...q, filters: q.filters ? JSON.stringify(q.filters) : undefined }, o),
    /** Update (`set`) or delete every row matching at least one filter, all or nothing. */
    bulkRows: (id: string, body: { action: "update"; filters: TableRowFilter[]; set: Record<string, unknown> } | { action: "delete"; filters: TableRowFilter[] }, o?: RequestOptions) => this.h.data<{ matched: number; updated?: number; deleted?: number }>("POST", `/tables/${id}/rows/bulk`, { body, ...o }),
    rowHistory: (id: string, rowId: string, o?: RequestOptions) => this.h.data<TableRowChange[]>("GET", `/tables/${id}/rows/${rowId}/history`, o),
    addRows: (id: string, rows: Record<string, unknown> | Record<string, unknown>[], o?: RequestOptions) => this.h.data<TableRow[]>("POST", `/tables/${id}/rows`, { body: rows, ...o }),
    updateRow: (id: string, rowId: string, cells: Record<string, unknown>, o?: RequestOptions) => this.h.data<TableRow>("PATCH", `/tables/${id}/rows/${rowId}`, { body: cells, ...o }),
    deleteRow: (id: string, rowId: string, o?: RequestOptions) => this.h.data<void>("DELETE", `/tables/${id}/rows/${rowId}`, o),
    importCsv: (id: string, csv: string, o?: RequestOptions) => this.h.data<{ created: number; updated: number; errors: { line: number; reason: string }[] }>("POST", `/tables/${id}/import`, { body: { csv }, ...o }),
    exportCsv: (id: string, o?: RequestOptions) => this.h.data<{ filename: string; csv: string }>("GET", `/tables/${id}/export`, o),
  };
  /** Run a form's saved logic scenarios (settings.logicTests) against its draft. Publishing runs them too. */
  runLogicTests(formId: string, o?: RequestOptions) { return this.h.data<LogicTestResult>("POST", `/forms/${formId}/logic-tests/run`, o); }
}
