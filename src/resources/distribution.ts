import type { HttpClient, RequestOptions } from "../core";

export type Channel = "email" | "sms" | "whatsapp";
export type Contact = {
  id: string; email: string | null; phone: string | null; name: string | null; language: string | null; attributes: Record<string, string> | null; tags: string[] | null;
  emailOptOutAt: number | null; smsOptOutAt: number | null; source: string; createdAt: number; updatedAt: number;
};
export type ContactInput = { email?: string | null; phone?: string | null; name?: string | null; language?: string | null; attributes?: Record<string, string>; tags?: string[]; emailOptOut?: boolean; smsOptOut?: boolean };
export type ContactProfile = Contact & {
  lists: { id: string; name: string }[];
  responses: { id: string; formId: string; number: number | null; completedAt: number | null; status: string }[];
  invitations: { id: string; formId: string; channel: Channel; sentAt: number | null; openedAt: number | null; clickedAt: number | null; respondedAt: number | null }[];
};
export type ContactList = { id: string; name: string; createdAt: number; members: number };
export type Recurrence = { every: "day" | "week" | "month"; interval: number; endAt?: number; maxRuns?: number };
export type DistributionInput = {
  listId: string; channel?: Channel; sendAt?: number; subject?: string; message?: string; recurrence?: Recurrence;
  remindAfterDays?: number[]; expiresInDays?: number; quickAnswer?: boolean;
};
export type Distribution = DistributionInput & { id: string; formId: string; status: "scheduled" | "running" | "done" | "cancelled"; runs: number; lastRunAt: number | null; sendAt: number };

/** Contacts, lists and sending a form to a list: bulk, scheduled, recurring, with reminders and one-click answers. */
export class DistributionResource {
  constructor(private readonly h: HttpClient) {}

  readonly contacts = {
    list: (q?: { q?: string; tag?: string; listId?: string; limit?: number; offset?: number }, o?: RequestOptions) => this.h.data<{ items: Contact[]; total: number }>("GET", "/contacts", { query: q, ...o }),
    /** Creates the contact, or updates the one with the same email (tags and attributes merge). */
    upsert: (body: ContactInput, o?: RequestOptions) => this.h.data<Contact & { created: boolean }>("POST", "/contacts", { body, ...o }),
    /** Profile with lists, invitations and the responses linked to this contact. */
    get: (id: string, o?: RequestOptions) => this.h.data<ContactProfile>("GET", `/contacts/${id}`, o),
    update: (id: string, body: ContactInput, o?: RequestOptions) => this.h.data<Contact>("PATCH", `/contacts/${id}`, { body, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<{ ok: true }>("DELETE", `/contacts/${id}`, o),
    /** CSV text (header: email, phone, name, language, tags; other columns become attributes) or an array. */
    import: (body: { csv?: string; contacts?: ContactInput[]; listId?: string; tags?: string[] }, o?: RequestOptions) => this.h.data<{ created: number; updated: number; errors: { line: number; reason: string }[] }>("POST", "/contacts/import", { body, ...o }),
  };

  readonly lists = {
    list: (o?: RequestOptions) => this.h.data<ContactList[]>("GET", "/contact-lists", o),
    create: (name: string, o?: RequestOptions) => this.h.data<ContactList>("POST", "/contact-lists", { body: { name }, ...o }),
    delete: (id: string, o?: RequestOptions) => this.h.data<{ ok: true }>("DELETE", `/contact-lists/${id}`, o),
    members: (id: string, body: { add?: string[]; remove?: string[]; addByTag?: string }, o?: RequestOptions) => this.h.data<{ listId: string; members: number }>("POST", `/contact-lists/${id}/members`, { body, ...o }),
  };

  readonly sends = {
    list: (formId: string, o?: RequestOptions) => this.h.data<Distribution[]>("GET", `/forms/${formId}/distributions`, o),
    /** Send a form to a list now, at `sendAt`, or on a cadence. Opted-out contacts are skipped. */
    create: (formId: string, body: DistributionInput, o?: RequestOptions) => this.h.data<Distribution>("POST", `/forms/${formId}/distributions`, { body, ...o }),
    cancel: (id: string, o?: RequestOptions) => this.h.data<{ ok: true }>("DELETE", `/distributions/${id}`, o),
  };

  /** Enter a response on someone's behalf (paper form, phone call). It is marked manual in its metadata. */
  manualResponse(formId: string, body: { answers: Record<string, unknown>; contactId?: string }, o?: RequestOptions) { return this.h.data<{ submissionId: string; manual: true }>("POST", `/forms/${formId}/manual-response`, { body, ...o }); }
}
