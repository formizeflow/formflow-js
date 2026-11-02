import type { HttpClient, RequestOptions } from "../core";

type Json = Record<string, unknown>;
export type QuickIntegrationPreset = {
  id: string; label: string; adapter: string; adapterName: string; available: boolean; reason?: string;
  params: { key: string; label: string }[]; mapped: { target: string; fieldId: string; fieldLabel: string }[]; connections: { id: string; name: string }[];
};
export type Booking = { id: string; submissionId: string; fieldId: string; startsAt: string; endsAt: string; status: "booked" | "cancelled"; email: string | null };

/** One-click integration presets and native scheduling (appointment fields with availability rules). */
export class SchedulingResource {
  constructor(private readonly h: HttpClient) {}

  readonly quickIntegrations = {
    list: (formId: string, o?: RequestOptions) => this.h.data<{ presets: QuickIntegrationPreset[] }>("GET", `/forms/${formId}/quick-integrations`, o),
    /** Creates a normal workflow from a preset. `params` holds the values the preset lists (for example { listId }). */
    apply: (formId: string, body: { presetId: string; connectionId: string; params?: Record<string, string> }, o?: RequestOptions) => this.h.data<Json>("POST", `/forms/${formId}/quick-integrations`, { body, ...o }),
  };

  /** Open slots of an appointment field (public endpoint; no credentials needed). */
  availability(slug: string, fieldId: string, q: { from?: string; to?: string } = {}, o?: RequestOptions) {
    return this.h.data<{ timezone: string; durationMinutes: number; slots: { start: string; remaining: number }[] }>("GET", `/public/forms/${slug}/availability/${fieldId}`, { query: q, ...o });
  }
  readonly bookings = {
    list: (formId: string, q: { status?: "booked" | "cancelled"; limit?: number } = {}, o?: RequestOptions) => this.h.data<Booking[]>("GET", `/forms/${formId}/bookings`, { query: q, ...o }),
    cancel: (bookingId: string, o?: RequestOptions) => this.h.data<{ status: "cancelled" }>("POST", `/bookings/${bookingId}/cancel`, { body: {}, ...o }),
  };
  /** The respondent's own booking, by the signed token in the email link. */
  readonly manage = {
    get: (token: string, o?: RequestOptions) => this.h.data<Json>("GET", `/public/bookings/${token}`, o),
    slots: (token: string, q: { from?: string; to?: string } = {}, o?: RequestOptions) => this.h.data<{ slots: { start: string }[] }>("GET", `/public/bookings/${token}/slots`, { query: q, ...o }),
    reschedule: (token: string, start: string, o?: RequestOptions) => this.h.data<{ startsAt: string }>("POST", `/public/bookings/${token}/reschedule`, { body: { start }, ...o }),
    cancel: (token: string, o?: RequestOptions) => this.h.data<{ status: "cancelled" }>("POST", `/public/bookings/${token}/cancel`, { body: {}, ...o }),
  };
}
