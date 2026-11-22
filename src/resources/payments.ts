import type { HttpClient, RequestOptions } from "../core";

type Json = Record<string, unknown>;
export type SavedMethod = { id: string; submissionId: string; formId: string; status: "active" | "removed"; testMode: boolean; createdAt: number };
export type ChargeSavedResult = { paymentId: string; status: "paid" | "failed" | "requires_action"; paymentLink?: string; emailed?: boolean };
export type VerificationCheck = { id: string; formId: string; fieldId: string; submissionId: string | null; kind: "identity" | "bank"; provider: "stripe_identity" | "plaid"; providerRef: string | null; accountRef: string | null; institution: string | null; status: "pending" | "verified" | "failed" | "canceled"; testMode: boolean; createdAt: number };
export type PaymentStatus = "created" | "pending" | "paid" | "failed" | "expired" | "partially_refunded" | "refunded";
/** Credentials are write-only: they are verified with the provider, stored encrypted and never returned. */
export type ConnectInput =
  | { kind: "stripe_key"; secretKey: string; webhookSecret?: string; label?: string }
  | { kind: "stripe_webhook_secret"; webhookSecret: string }
  | { kind: "paypal"; clientId: string; clientSecret: string; env: "sandbox" | "live"; webhookId?: string; label?: string }
  | { kind: "square"; accessToken: string; locationId: string; env: "sandbox" | "production"; signatureKey?: string; label?: string }
  | { kind: "mollie"; apiKey: string; label?: string }
  | { kind: "braintree"; merchantId: string; publicKey: string; privateKey: string; env: "sandbox" | "production"; merchantAccountId?: string; label?: string }
  | { kind: "authorizenet"; apiLoginId: string; transactionKey: string; env: "sandbox" | "production"; signatureKey?: string; label?: string }
  /** secretKey is sk_test_... (sandbox) or sk_live_... Paystack signs webhooks with it. */
  | { kind: "paystack"; secretKey: string; label?: string }
  /** accessToken is TEST-... (sandbox) or APP_USR-... (live); webhookSecret is the signing secret from the app's Webhooks page. */
  | { kind: "mercadopago_webhook_secret"; webhookSecret: string }
  | { kind: "mercadopago"; accessToken: string; webhookSecret?: string; label?: string };
export type PaymentConnection = {
  id: string; provider: "stripe" | "paypal" | "square" | "mollie" | "braintree" | "authorizenet" | "paystack" | "mercadopago"; kind: "stripe_key" | "stripe_connect" | "paypal" | "square" | "mollie" | "braintree" | "authorizenet" | "paystack" | "mercadopago"; accountId: string | null; label: string | null; livemode: boolean;
  status: string; lastError: string | null; verifiedAt: number | null;
  /** A test-mode credential set is saved next to the live one. */
  hasTestCredentials: boolean;
  /** Register this URL and events in the provider's dashboard. */
  webhookUrl: string; webhookEvents: string[]; webhookConfigured: boolean;
};
export type PaymentRules = {
  tax?: { enabled?: boolean; label?: string; inclusive?: boolean; defaultPercent?: number; regionFieldId?: string; regions?: { region: string; percent: number }[]; shippingTaxable?: boolean };
  shipping?: { enabled?: boolean; methods?: { id: string; label: string; price: string; freeOver?: string; regions?: string[] }[]; methodFieldId?: string; regionFieldId?: string };
  subscription?: { interval?: "day" | "week" | "month" | "year"; intervalCount?: number; trialDays?: number; recurringDonation?: boolean };
  /** Stripe, one-time payments: keep the card (provider ids only) so it can be charged later with `savedMethods.charge`. With nothing owed now, Checkout only saves the card. */
  cardOnFile?: boolean;
  /** Stripe pmc_... id choosing the wallets (Apple Pay, Google Pay, Link) and methods Checkout offers. */
  stripePaymentMethodConfiguration?: string;
  /** Apple Pay / Google Pay per provider. square: on the hosted link; mollie: applePay shortcut (no Google Pay); braintree: both as buttons in the payment panel; authorizenet: googlePay only. */
  wallets?: Partial<Record<"stripe" | "square" | "mollie" | "braintree" | "authorizenet", { applePay?: boolean; googlePay?: boolean }>>;
};

/** Payments run through the workspace's own Stripe or PayPal account; FormFlow does not hold funds. */
export class PaymentsResource {
  constructor(private readonly h: HttpClient) {}
  /** The ledger as CSV (up to 10,000 rows, oldest first). `truncated` means narrow it with from/to. */
  exportCsv(q: { status?: PaymentStatus; formId?: string; from?: number; to?: number } = {}, o?: RequestOptions) { return this.h.data<{ filename: string; contentType: string; rows: number; truncated: boolean; csv: string }>("GET", "/payments/export", { query: q, ...o }); }
  list(q: { status?: PaymentStatus; formId?: string; flagged?: boolean; before?: number; limit?: number } = {}, o?: RequestOptions) {
    return this.h.data<Json[]>("GET", "/payments", { query: { ...q, flagged: q.flagged ? "1" : undefined }, ...o });
  }
  /** Only an amount you confirm (`confirmAmountMinor`, equal to the refund amount) is refunded. Defaults to the remaining balance. */
  refund(paymentId: string, body: { confirmAmountMinor: number; amountMinor?: number; reason?: "requested_by_customer" | "duplicate" | "fraudulent" }, o?: RequestOptions) {
    return this.h.data<{ refundId: string; status: string; refundedMinor: number }>("POST", `/payments/${paymentId}/refund`, { body, ...o });
  }
  /** Ask the provider for the current state and repair what a missed webhook left behind. */
  sync(paymentId: string, o?: RequestOptions) { return this.h.data<Json>("POST", `/payments/${paymentId}/sync`, { body: {}, ...o }); }

  /** Braintree / Authorize.Net: charge the submission's open payment with a browser-SDK token. The amount is the server-priced one. */
  charge(submissionId: string, body: { nonce?: string; dataDescriptor?: string; dataValue?: string }, o?: RequestOptions) {
    return this.h.data<{ status: "paid" | "failed"; paymentId: string }>("POST", `/public/payments/${submissionId}/charge`, { body, ...o });
  }
  /** Recover or re-open checkout. `wallet: "applePay"` opens Mollie's hosted page on Apple Pay when the form enables it. Braintree and Authorize.Net return `client` instead of a URL. */
  checkout(submissionId: string, wallet?: "applePay" | "googlePay", o?: RequestOptions) {
    return this.h.data<{ checkoutUrl?: string; provider?: string; client?: Record<string, string> }>("POST", `/public/payments/${submissionId}/checkout`, { query: { wallet }, ...o });
  }

  readonly connections = {
    list: (o?: RequestOptions) => this.h.data<{ connections: PaymentConnection[] }>("GET", "/payments/connections", o),
    connect: (body: ConnectInput, o?: RequestOptions) => this.h.data<PaymentConnection>("POST", "/payments/connections", { body, ...o }),
    /** Adds test-mode credentials next to the live ones (same body as `connect`). Used for test-mode responses. */
    connectTest: (body: ConnectInput, o?: RequestOptions) => this.h.data<PaymentConnection>("POST", "/payments/connections/test", { body, ...o }),
    disconnect: (id: string, o?: RequestOptions) => this.h.data<null>("DELETE", `/payments/connections/${id}`, o),
    /** Stripe Connect OAuth URL to navigate a signed-in owner to. Needs Connect configured on the instance. */
    stripeAuthorize: (o?: RequestOptions) => this.h.data<{ url: string }>("POST", "/payments/connections/stripe/authorize", { body: {}, ...o }),
  };
  /** Cards respondents agreed to keep (Stripe ids only). */
  readonly savedMethods = {
    list: (q: { submissionId?: string; formId?: string; limit?: number } = {}, o?: RequestOptions) => this.h.data<{ methods: SavedMethod[] }>("GET", "/payments/saved-methods", { query: q, ...o }),
    /** Charges the card with no respondent present. The same `idempotencyKey` is one charge however often it is sent. `requires_action` means the bank wants the respondent: they were emailed a link (also returned). Refund through `refund`. */
    charge: (id: string, body: { amountMinor: number; description: string; idempotencyKey: string; currency?: string }, o?: RequestOptions) => this.h.data<ChargeSavedResult>("POST", `/payments/saved-methods/${id}/charge`, { body, ...o }),
  };
  /** Workspace-wide test mode. A form can also set `settings.testMode`. */
  readonly testMode = {
    get: (o?: RequestOptions) => this.h.data<{ testMode: boolean }>("GET", "/payments/test-mode", o),
    set: (enabled: boolean, o?: RequestOptions) => this.h.data<{ testMode: boolean }>("PUT", "/payments/test-mode", { body: { enabled }, ...o }),
  };
  /** Identity (Stripe Identity) and bank (Plaid) checks from `id_check` fields. Ids and status only. */
  readonly checks = {
    list: (q: { submissionId?: string; formId?: string; limit?: number } = {}, o?: RequestOptions) => this.h.data<{ checks: VerificationCheck[] }>("GET", "/verification-checks", { query: q, ...o }),
  };
  readonly rules = {
    get: (formId: string, o?: RequestOptions) => this.h.data<PaymentRules>("GET", `/forms/${formId}/payment-settings`, o),
    set: (formId: string, rules: PaymentRules, o?: RequestOptions) => this.h.data<PaymentRules>("PUT", `/forms/${formId}/payment-settings`, { body: rules, ...o }),
  };
}
