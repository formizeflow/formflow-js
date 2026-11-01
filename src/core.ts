import { errorFor, FormFlowError } from "./errors";

export const DEFAULT_VERSION = "2026-10-01";

export type ClientOptions = {
  apiKey: string;
  /** Instance origin, e.g. https://forms.example.com (no /api/v1). */
  baseUrl?: string;
  version?: string;
  /** Retries for 429, 5xx and network errors. Default 3. */
  maxRetries?: number;
  /** Per-attempt timeout in ms. Default 30000. */
  timeoutMs?: number;
  /** Default workspace header; only needed for user/OAuth credentials with several workspaces. */
  workspaceId?: string;
  fetch?: typeof fetch;
  /** Overridable for tests. */
  sleep?: (ms: number) => Promise<void>;
};

/** Accepted by every method. */
export type RequestOptions = {
  /** Cancels the request and any pending retry. */
  signal?: AbortSignal;
  /** Sent as Idempotency-Key on POST. Generated automatically when omitted so retries are safe. */
  idempotencyKey?: string;
};

export type Page<T> = { data: T[]; nextCursor: string | null };
export type ListParams = { cursor?: string; limit?: number };

type Init = { query?: object; body?: unknown } & RequestOptions;

const sleepDefault = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason); }, { once: true });
  });
const backoff = (attempt: number) => Math.min(30_000, 500 * 2 ** attempt) * (0.75 + Math.random() * 0.5);
const randomKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export class HttpClient {
  readonly opts: Required<Pick<ClientOptions, "apiKey" | "baseUrl" | "version" | "maxRetries" | "timeoutMs">> & Pick<ClientOptions, "fetch" | "sleep" | "workspaceId">;

  constructor(o: ClientOptions) {
    if (!o.apiKey) throw new Error("FormFlow: apiKey is required");
    this.opts = {
      apiKey: o.apiKey, baseUrl: (o.baseUrl ?? "https://app.formflow.dev").replace(/\/$/, ""), version: o.version ?? DEFAULT_VERSION,
      maxRetries: o.maxRetries ?? 3, timeoutMs: o.timeoutMs ?? 30_000, fetch: o.fetch, sleep: o.sleep, workspaceId: o.workspaceId,
    };
  }

  /** Low-level request: retries 429/5xx/network errors with backoff (honors Retry-After). Returns the parsed JSON body. */
  async request<T = unknown>(method: string, path: string, init: Init = {}): Promise<T> {
    const url = new URL(`${this.opts.baseUrl}/api/v1${path}`);
    for (const [k, v] of Object.entries(init.query ?? {})) if (v !== undefined && v !== null) url.searchParams.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    const headers: Record<string, string> = { Authorization: `Bearer ${this.opts.apiKey}`, "FormFlow-Version": this.opts.version, Accept: "application/json" };
    if (this.opts.workspaceId) headers["FormFlow-Workspace"] = this.opts.workspaceId;
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    const key = init.idempotencyKey ?? (method === "POST" ? randomKey() : undefined);
    if (key) headers["Idempotency-Key"] = key;
    const doFetch = this.opts.fetch ?? fetch;
    const sleep = this.opts.sleep ?? ((ms: number) => sleepDefault(ms, init.signal));

    for (let attempt = 0; ; attempt++) {
      if (init.signal?.aborted) throw init.signal.reason;
      const timeout = AbortSignal.timeout(this.opts.timeoutMs);
      const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
      let res: Response;
      try {
        res = await doFetch(url.toString(), { method, headers, signal, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
      } catch (e) {
        if (init.signal?.aborted) throw init.signal.reason; // caller cancelled: never retry
        if (attempt >= this.opts.maxRetries) throw new FormFlowError(0, "network_error", e instanceof Error ? e.message : "Network error");
        await sleep(backoff(attempt));
        continue;
      }
      if (res.ok) return (res.status === 204 ? null : await res.json()) as T;
      const retryAfter = Number(res.headers.get("retry-after")) || undefined;
      if ((res.status === 429 || res.status >= 500) && attempt < this.opts.maxRetries) {
        await sleep(retryAfter ? retryAfter * 1000 : backoff(attempt));
        continue;
      }
      let body: unknown = null;
      try { body = await res.json(); } catch { /* non-JSON error body */ }
      throw errorFor(res.status, body, res.headers.get("x-request-id") ?? undefined, retryAfter);
    }
  }

  async data<T>(method: string, path: string, init?: Init): Promise<T> {
    // 204 responses have no body
    return (await this.request<{ data: T } | null>(method, path, init))?.data as T;
  }

  page<T>(path: string, q?: object, o?: RequestOptions): Promise<Page<T>> {
    return this.request<Page<T>>("GET", path, { query: q, ...o }).then((r) => ({ data: r.data, nextCursor: r.nextCursor ?? null }));
  }

  /** Auto-paginating async iterator over any list endpoint. */
  async *paginate<T>(path: string, q: ListParams & object = {}, o?: RequestOptions): AsyncGenerator<T, void, void> {
    let cursor = q.cursor;
    do {
      const p = await this.page<T>(path, { ...q, cursor }, o);
      yield* p.data;
      cursor = p.nextCursor ?? undefined;
    } while (cursor);
  }
}
