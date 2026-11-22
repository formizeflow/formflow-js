import type { HttpClient, RequestOptions } from "../core";
import type { Channel } from "./distribution";

export type ProgramSchedule = "weekly" | "monthly" | "quarterly" | "manual";
export type ProgramInput = {
  formId: string; name: string; schedule?: ProgramSchedule; /** Epoch ms the first wave starts; default now. */ anchorAt?: number;
  /** Contact list each wave is sent to. Omit to only collect responses. */ listId?: string | null; channel?: Channel; subject?: string | null; message?: string | null;
  remindAfterDays?: number[]; expiresInDays?: number;
  /** Email when a finished wave's metric (mean, NPS, CSAT %, CES) for `fieldId` is below `below`. Default recipients: owners and admins. */
  alert?: ProgramAlert | null;
};
export type ProgramAlert = { fieldId: string; below: number; notify?: string[] };
export type Program = {
  id: string; formId: string; name: string; schedule: ProgramSchedule; anchorAt: number; listId: string | null; channel: Channel; subject: string | null; message: string | null;
  remindAfterDays: number[] | null; expiresInDays: number | null; alert: (ProgramAlert & { lastAlertedSeq?: number }) | null; status: "active" | "paused"; createdAt: number; updatedAt: number;
};
export type Wave = { id: string; programId: string; seq: number; label: string; startsAt: number; endsAt: number | null; distributionId: string | null; createdAt: number };
export type TrendChoice = { key: string; label: string; count: number; pct: number; changePct: number | null };
export type TrendPoint = { waveId: string; label: string; n: number; value: number | null; change: number | null; choices?: TrendChoice[] };
export type FieldTrend = { fieldId: string; label: string; type: string; metric: "mean" | "nps" | "csat" | "ces" | "choice"; points: TrendPoint[] };
export type ProgramTrend = {
  program: Program;
  waves: { id: string; seq: number; label: string; from: number; to: number | null; responses: number; invited: number; responded: number; responseRate: number | null }[];
  fields: FieldTrend[];
};

export type HrSyncResult = { total: number; created: number; updated: number; skipped: number; deactivated?: number; errors: { row: number; reason: string }[] };
export type HrisConnection = {
  id: string; name: string; source: "bamboohr" | "csv" | "scim"; integrationConnectionId: string | null; mapping: Record<string, string>; deactivateMissing: boolean; intervalHours: number | null;
  scimUrl: string; hasScimToken: boolean; lastSyncAt: number | null; lastStatus: "ok" | "error" | null; lastError: string | null; createdAt: number;
};
export type HrisConnectionInput = { name: string; source: "bamboohr" | "csv" | "scim"; integrationConnectionId?: string; mapping?: Record<string, string>; deactivateMissing?: boolean; intervalHours?: number | null };
export type HrisSyncRun = { id: string; trigger: "manual" | "schedule" | "csv" | "scim"; status: "ok" | "error"; result: Record<string, unknown>; createdAt: number };
export type CrmTriggerEvent = { id: string; eventId: string; status: "queued" | "duplicate" | "failed"; invitationId: string | null; error: string | null; createdAt: number };
export type CrmTrigger = { id: string; name: string; formId: string; channel: "email" | "sms"; expiresInDays: number | null; fieldMapping: Record<string, string>; lastUsedAt: number | null; createdAt: number; url: string };
export type AttributeBreakdown = { attribute: string; fieldId: string; minGroup: number; groups: { value: string; n: number; summary: unknown | null }[]; unmatched: number; suppressed: number };

/** Survey programs (recurring waves and the trend across them), HR attribute sync into contacts, and CRM-triggered invites. */
export class ProgramsResource {
  constructor(private readonly h: HttpClient) {}

  readonly programs = {
    list: (formId?: string, o?: RequestOptions) => this.h.data<Program[]>("GET", "/programs", { query: { formId }, ...o }),
    /** Scheduled programs (weekly, monthly, quarterly) start their own waves; a manual program starts one when you call `startWave`. */
    create: (body: ProgramInput, o?: RequestOptions) => this.h.data<Program>("POST", "/programs", { body, ...o }),
    get: (id: string, o?: RequestOptions) => this.h.data<Program & { waves: Wave[] }>("GET", `/programs/${id}`, o),
    update: (id: string, body: Partial<Omit<ProgramInput, "formId" | "schedule" | "anchorAt">> & { status?: "active" | "paused" }, o?: RequestOptions) => this.h.data<Program>("PATCH", `/programs/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<{ ok: true }>("DELETE", `/programs/${id}`, o),
    /** Starts the next wave; with a list on the program it also sends the form to that list. */
    startWave: (id: string, body: { label?: string; startsAt?: number; endsAt?: number | null; send?: boolean } = {}, o?: RequestOptions) => this.h.data<Wave>("POST", `/programs/${id}/waves`, { body, ...o }),
    /** Counts, averages, NPS and choice shares per wave for every comparable question, each with the change vs the previous wave. */
    trend: (id: string, q?: { fieldIds?: string[]; waves?: number }, o?: RequestOptions) => this.h.data<ProgramTrend>("GET", `/programs/${id}/trend`, { query: { fieldIds: q?.fieldIds?.join(","), waves: q?.waves }, ...o }),
  };

  readonly hris = {
    /** Pulls current employees from a BambooHR integration connection into contact attributes. */
    syncBambooHr: (connectionId: string, o?: RequestOptions) => this.h.data<HrSyncResult>("POST", "/hris/sync", { body: { source: "bamboohr", connectionId }, ...o }),
    /** SCIM 2.0 User resources or a CSV export (any HRIS; for Workday, export its report as CSV). `mapping` is { segmentKey: columnName }. */
    import: (body: { format: "csv"; csv: string; mapping?: Record<string, string> } | { format: "scim"; resources: Record<string, unknown>[] }, o?: RequestOptions) => this.h.data<HrSyncResult>("POST", "/hris/import", { body, ...o }),
    /** One question split by a contact attribute. Groups smaller than `minGroup` (default 5) come back without a summary. */
    /** Stored sources. `create` and `update` with rotateScimToken return the SCIM bearer `scimToken` once; point a directory at `scimUrl` (SCIM 2.0 /Users). */
    connections: {
      list: (o?: RequestOptions) => this.h.data<HrisConnection[]>("GET", "/hris/connections", o),
      create: (body: HrisConnectionInput, o?: RequestOptions) => this.h.data<HrisConnection & { scimToken: string }>("POST", "/hris/connections", { body, ...o }),
      update: (id: string, body: Partial<Omit<HrisConnectionInput, "source">> & { rotateScimToken?: boolean }, o?: RequestOptions) => this.h.data<HrisConnection & { scimToken?: string }>("PATCH", `/hris/connections/${id}`, { body, ...o }),
      delete: (id: string, o?: RequestOptions) => this.h.data<{ ok: true }>("DELETE", `/hris/connections/${id}`, o),
      /** Pulls a BambooHR source now with its saved settings. */
      sync: (id: string, o?: RequestOptions) => this.h.data<HrSyncResult>("POST", `/hris/connections/${id}/sync`, { body: {}, ...o }),
      /** Uploads a CSV through a csv source; `mapping` is saved for the next upload. */
      importCsv: (id: string, body: { csv: string; mapping?: Record<string, string> }, o?: RequestOptions) => this.h.data<HrSyncResult>("POST", `/hris/connections/${id}/import`, { body, ...o }),
      runs: (id: string, o?: RequestOptions) => this.h.data<HrisSyncRun[]>("GET", `/hris/connections/${id}/runs`, o),
    },
    /** Column-mapping step: headers, sample rows and the suggested { segmentKey: column } mapping. */
    previewCsv: (csv: string, o?: RequestOptions) => this.h.data<{ headers: string[]; sample: string[][]; rows: number; suggested: Record<string, string> }>("POST", "/hris/preview", { body: { csv }, ...o }),
    breakdown: (formId: string, q: { attribute: string; fieldId: string; minGroup?: number }, o?: RequestOptions) => this.h.data<AttributeBreakdown>("GET", `/forms/${formId}/attribute-breakdown`, { query: q, ...o }),
  };

  readonly crmTriggers = {
    list: (o?: RequestOptions) => this.h.data<CrmTrigger[]>("GET", "/crm-triggers", o),
    /** The signing `secret` is in this response only. Sign each CRM call: `X-FormFlow-Signature: t=<unix s>,v1=<hex HMAC-SHA256(secret, t + "." + body)>`. */
    create: (body: { name: string; formId: string; channel?: "email" | "sms"; expiresInDays?: number; fieldMapping?: Record<string, string> }, o?: RequestOptions) => this.h.data<CrmTrigger & { secret: string }>("POST", "/crm-triggers", { body, ...o }),
    /** `rotateSecret` returns a new signing secret once; the old one stops working. */
    update: (id: string, body: { name?: string; expiresInDays?: number | null; fieldMapping?: Record<string, string> | null; rotateSecret?: boolean }, o?: RequestOptions) => this.h.data<CrmTrigger & { secret?: string }>("PATCH", `/crm-triggers/${id}`, { body, ...o }),
    /** Delivery log, newest first. */
    events: (id: string, o?: RequestOptions) => this.h.data<CrmTriggerEvent[]>("GET", `/crm-triggers/${id}/events`, o),
    /** Creates the "write answers back" workflow: on each response, send the email and chosen answers to a CRM integration action. */
    writeBack: (id: string, body: { connectionId: string; action?: string; fields?: Record<string, string> }, o?: RequestOptions) => this.h.data<{ id: string }>("POST", `/crm-triggers/${id}/write-back`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<{ ok: true }>("DELETE", `/crm-triggers/${id}`, o),
  };
}
