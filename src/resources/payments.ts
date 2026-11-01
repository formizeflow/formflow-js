import type { HttpClient, RequestOptions } from "../core";

type Json = Record<string, unknown>;
export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "expired" | "partially_refunded" | "refunded";
/** Credentials are write-only: they are verified with the provider, stored encrypted and never returned. */
export type ConnectInput =
  | { kind: "stripe_key"; secretKey: string; webhookSecret?: string; label?: string }
  | { kind: "stripe_webhook_secret"; webhookSecret: string }
  | { kind: "paypal"; clientId: string; clientSecret: string; env: "sandbox" | "live"; webhookId?: string; label?: string };
export type PaymentConnection = {
  id: string; provider: "stripe" | "paypal"; kind: "stripe_key" | "stripe_connect" | "paypal"; accountId: string | null; label: string | null; livemode: boolean;
  status: string; lastError: string | null; verifiedAt: number | null;
  /** Register this URL and events in the provider's dashboard. */
  webhookUrl: string; webhookEvents: string[]; webhookConfigured: boolean;
};
export type PaymentRules = {
  tax?: { enabled?: boolean; label?: string; inclusive?: boolean; defaultPercent?: number; regionFieldId?: string; regions?: { region: string; percent: number }[]; shippingTaxable?: boolean };
  shipping?: { enabled?: boolean; methods?: { id: string; label: string; price: string; freeOver?: string; regions?: string[] }[]; methodFieldId?: string; regionFieldId?: string };
  subscription?: { interval?: "day" | "week" | "month" | "year"; intervalCount?: number; trialDays?: number; recurringDonation?: boolean };
};

/** Payments run through the workspace's own Stripe or PayPal account; FormFlow does not hold funds. */
export class PaymentsResource {
  constructor(private readonly h: HttpClient) {}
  list(q: { status?: PaymentStatus; formId?: string; flagged?: boolean; before?: number; limit?: number } = {}, o?: RequestOptions) {
    return this.h.data<Json[]>("GET", "/payments", { query: { ...q, flagged: q.flagged ? "1" : undefined }, ...o });
  }
  /** Only an amount you confirm (`confirmAmountMinor`, equal to the refund amount) is refunded. Defaults to the remaining balance. */
  refund(paymentId: string, body: { confirmAmountMinor: number; amountMinor?: number; reason?: "requested_by_customer" | "duplicate" | "fraudulent" }, o?: RequestOptions) {
    return this.h.data<{ refundId: string; status: string; refundedMinor: number }>("POST", `/payments/${paymentId}/refund`, { body, ...o });
  }
  /** Ask the provider for the current state and repair what a missed webhook left behind. */
  sync(paymentId: string, o?: RequestOptions) { return this.h.data<Json>("POST", `/payments/${paymentId}/sync`, { body: {}, ...o }); }

  readonly connections = {
    list: (o?: RequestOptions) => this.h.data<{ connections: PaymentConnection[] }>("GET", "/payments/connections", o),
    connect: (body: ConnectInput, o?: RequestOptions) => this.h.data<PaymentConnection>("POST", "/payments/connections", { body, ...o }),
    disconnect: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/payments/connections/${id}`, o),
    /** Stripe Connect OAuth URL to navigate a signed-in owner to. Needs Connect configured on the instance. */
    stripeAuthorize: (o?: RequestOptions) => this.h.data<{ url: string }>("POST", "/payments/connections/stripe/authorize", { body: {}, ...o }),
  };
  readonly rules = {
    get: (formId: string, o?: RequestOptions) => this.h.data<PaymentRules>("GET", `/forms/${formId}/payment-settings`, o),
    set: (formId: string, rules: PaymentRules, o?: RequestOptions) => this.h.data<PaymentRules>("PUT", `/forms/${formId}/payment-settings`, { body: rules, ...o }),
  };
}
