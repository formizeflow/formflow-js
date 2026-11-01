import type { HttpClient, ListParams, Page, RequestOptions } from "../core";

export const EVENT_TYPES = [
  "form.published", "form.updated", "form.archived", "submission.created", "submission.completed", "submission.deleted",
  "payment.status_changed", "workflow.completed", "workflow.failed",
  "experiment.started", "experiment.paused", "experiment.guardrail_breached", "experiment.winner_declared", "experiment.promoted",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type WebhookEndpoint = { id: string; url: string; events: (EventType | "*")[]; formId: string | null; enabled: boolean; lastDeliveryAt?: number | null; createdAt?: number };
export type WebhookDelivery = { id: string; endpointId: string; eventType: string; status: "pending" | "succeeded" | "failed" | "dead"; attempts: number; responseStatus: number | null; error: string | null; createdAt: number };

export class WebhooksResource {
  constructor(private readonly h: HttpClient) {}
  list(o?: RequestOptions) { return this.h.data<WebhookEndpoint[]>("GET", "/webhooks", o); }
  /** The signing `secret` is returned once, here. Store it. */
  create(body: { url: string; events: (EventType | "*")[]; formId?: string }, o?: RequestOptions) { return this.h.data<{ endpoint: WebhookEndpoint; secret: string }>("POST", "/webhooks", { body, ...o }); }
  update(id: string, body: { url?: string; events?: (EventType | "*")[]; enabled?: boolean }, o?: RequestOptions) { return this.h.data<WebhookEndpoint>("PATCH", `/webhooks/${id}`, { body, ...o }); }
  delete(id: string, o?: RequestOptions) { return this.h.data<null>("DELETE", `/webhooks/${id}`, o); }
  deliveries(id: string, q?: ListParams, o?: RequestOptions): Promise<Page<WebhookDelivery>> { return this.h.page<WebhookDelivery>(`/webhooks/${id}/deliveries`, q, o); }
  deliveriesAll(id: string, q?: ListParams, o?: RequestOptions) { return this.h.paginate<WebhookDelivery>(`/webhooks/${id}/deliveries`, q, o); }
  redeliver(id: string, deliveryId: string, o?: RequestOptions) { return this.h.data<{ id: string }>("POST", `/webhooks/${id}/deliveries/${deliveryId}/redeliver`, { body: {}, ...o }); }
}
