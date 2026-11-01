import { verifyWebhookSignature } from "./webhooks";
import { FormFlowError } from "./errors";
import type { FormDefinition } from "./resources/definition";

type Envelope<T extends string, D> = { id: string; type: T; created: number; workspace_id: string; data: D };
type ExperimentEventData = { experimentId: string; formId: string; name: string; status?: string };
type Outcome = { scores?: Record<string, number>; leadScore?: number; leadTier?: string; passed?: boolean; outcomeId?: string; endingId?: string; quotaIds?: string[]; [k: string]: unknown };

/** Every webhook event, discriminated by `type`. Narrow with `switch (event.type)`. */
export type WebhookEvent =
  | Envelope<"form.published", { formId: string; versionId: string; version: number; slug: string }>
  | Envelope<"form.updated", { formId: string }>
  | Envelope<"form.archived", { formId: string }>
  | Envelope<"submission.created", { submissionId: string; formId: string; version: number; status: "partial" }>
  | Envelope<"submission.completed", {
      submissionId: string; formId: string; version: number;
      /** Field id to answer. Secret fields are omitted. */
      answers: Record<string, unknown>; labels: Record<string, string>; computed: Outcome;
      attribution: Record<string, string> | null; completedAt: number; paymentStatus: "none" | "pending" | "paid" | "failed" | "refunded";
    }>
  | Envelope<"submission.deleted", { submissionId: string; formId: string }>
  | Envelope<"payment.status_changed", { submissionId: string; formId?: string; paymentStatus: string; [k: string]: unknown }>
  | Envelope<"workflow.completed", { workflowId?: string; runId?: string; [k: string]: unknown }>
  | Envelope<"workflow.failed", { workflowId?: string; runId?: string; error?: string; [k: string]: unknown }>
  | Envelope<"experiment.started", ExperimentEventData>
  | Envelope<"experiment.paused", ExperimentEventData & { reason?: string }>
  | Envelope<"experiment.guardrail_breached", ExperimentEventData & { variantId: string; metric: string; relativeDrop: number; limit: number }>
  | Envelope<"experiment.winner_declared", ExperimentEventData & { winnerVariantId: string; auto: boolean; evidence?: Record<string, unknown> }>
  | Envelope<"experiment.promoted", ExperimentEventData & { winnerVariantId?: string | null; auto?: boolean; policy?: number }>
  | Envelope<"webhook.test", Record<string, unknown>>;

export type WebhookEventType = WebhookEvent["type"];
export type EventOf<T extends WebhookEventType> = Extract<WebhookEvent, { type: T }>;

/**
 * Verify the signature over the RAW body and return the typed event. Throws FormFlowError(400, "invalid_signature") otherwise.
 *   const event = await constructWebhookEvent(await req.text(), req.headers.get("formflow-signature"), secret);
 *   if (event.type === "submission.completed") event.data.answers
 */
export async function constructWebhookEvent(rawBody: string, signatureHeader: string | null | undefined, secret: string, toleranceSec = 300): Promise<WebhookEvent> {
  if (!(await verifyWebhookSignature(rawBody, signatureHeader, secret, toleranceSec))) throw new FormFlowError(400, "invalid_signature", "Webhook signature verification failed");
  try { return JSON.parse(rawBody) as WebhookEvent; } catch { throw new FormFlowError(400, "invalid_payload", "Webhook body is not JSON"); }
}

export const isEvent = <T extends WebhookEventType>(e: WebhookEvent, type: T): e is EventOf<T> => e.type === type;
export type { FormDefinition };
