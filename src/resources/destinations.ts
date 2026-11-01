import type { HttpClient, RequestOptions } from "../core";

export type DestinationKind = "posthog" | "amplitude" | "mixpanel" | "segment";
export type Destination = {
  id: string; kind: DestinationKind; name: string; enabled: boolean; lastError: string | null; canQuery: boolean;
  config: { eventFilter: string[]; propertyMap: Record<string, string> };
  /** Secret values read "set". */
  credentials: Record<string, string>;
};
export type FormAnalyticsSettings = {
  enabled: boolean; destinationIds?: string[] | null;
  /** Questions whose answer value may be sent. Sensitive and secret fields never are. */
  shareFieldIds?: string[];
  personProps?: { fieldId: string; property: string; mode?: "set" | "set_once" }[];
  groupKey?: string | null; groupType?: string | null; idleMinutes?: number;
};

/** Server-side analytics destinations and per-form forwarding. */
export class DestinationsResource {
  constructor(private readonly h: HttpClient) {}
  list(o?: RequestOptions) { return this.h.data<{ destinations: Destination[] }>("GET", "/destinations", o); }
  create(body: { kind: DestinationKind; name: string; credentials: Record<string, string>; config?: Partial<Destination["config"]>; enabled?: boolean }, o?: RequestOptions) { return this.h.data<Destination>("POST", "/destinations", { body, ...o }); }
  update(id: string, body: { name?: string; credentials?: Record<string, string>; config?: Partial<Destination["config"]>; enabled?: boolean }, o?: RequestOptions) { return this.h.data<Destination>("PATCH", `/destinations/${id}`, { body, ...o }); }
  delete(id: string, o?: RequestOptions) { return this.h.data<null>("DELETE", `/destinations/${id}`, o); }
  /** Sends one clearly labelled test event. */
  test(id: string, o?: RequestOptions) { return this.h.data<{ ok: boolean; error?: string }>("POST", `/destinations/${id}/test`, { body: {}, ...o }); }
  getFormSettings(formId: string, o?: RequestOptions) { return this.h.data<{ settings: FormAnalyticsSettings | null }>("GET", `/forms/${formId}/analytics-settings`, o); }
  putFormSettings(formId: string, body: FormAnalyticsSettings, o?: RequestOptions) { return this.h.data<FormAnalyticsSettings>("PUT", `/forms/${formId}/analytics-settings`, { body, ...o }); }
}
