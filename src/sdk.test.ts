import { describe, it, expect } from "vitest";
import { verifyWebhookSignature, signWebhookPayload } from "./webhooks";
import { FormFlowClient } from "./client";
import { ConflictError, RateLimitError } from "./errors";
import { createHmac } from "node:crypto";
const signPayload = (secret: string, body: string, t: number) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;

const secret = "whsec_test";
const body = JSON.stringify({ id: "evt_1", type: "form.published" });

describe("verifyWebhookSignature", () => {
  it("accepts a valid signature and matches the server implementation", async () => {
    const t = Math.floor(Date.now() / 1000);
    const header = `t=${t},v1=${await signWebhookPayload(body, secret, t)}`;
    expect(header).toBe(signPayload(secret, body, t));
    expect(await verifyWebhookSignature(body, header, secret)).toBe(true);
  });
  it("rejects tampering, wrong secret, stale timestamps and junk", async () => {
    const t = Math.floor(Date.now() / 1000);
    const header = `t=${t},v1=${await signWebhookPayload(body, secret, t)}`;
    expect(await verifyWebhookSignature(body + " ", header, secret)).toBe(false);
    expect(await verifyWebhookSignature(body, header, "other")).toBe(false);
    const old = t - 1000;
    expect(await verifyWebhookSignature(body, `t=${old},v1=${await signWebhookPayload(body, secret, old)}`, secret, 300)).toBe(false);
    expect(await verifyWebhookSignature(body, "garbage", secret)).toBe(false);
    expect(await verifyWebhookSignature(body, null, secret)).toBe(false);
  });
});

function fakeFetch(responses: Response[]) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = (async (url: string, init?: RequestInit) => { calls.push({ url, init }); return responses.shift()!; }) as unknown as typeof fetch;
  return { f, calls };
}
const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });

describe("FormFlowClient", () => {
  it("retries 429 honoring Retry-After and paginates", async () => {
    const sleeps: number[] = [];
    const { f, calls } = fakeFetch([
      json(429, { error: { code: "rate_limited", message: "x" } }, { "retry-after": "2" }),
      json(200, { data: [{ id: "a" }], nextCursor: "c1" }),
      json(200, { data: [{ id: "b" }], nextCursor: null }),
    ]);
    const c = new FormFlowClient({ apiKey: "ff_live_x", baseUrl: "http://h", fetch: f, sleep: async (ms) => { sleeps.push(ms); } });
    const ids: string[] = [];
    for await (const form of c.forms.listAll()) ids.push(form.id);
    expect(ids).toEqual(["a", "b"]);
    expect(sleeps).toEqual([2000]);
    expect(calls[2].url).toContain("cursor=c1");
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer ff_live_x");
  });
  it("throws typed errors without retrying 4xx", async () => {
    const { f, calls } = fakeFetch([json(409, { error: { code: "conflict", message: "stale", details: { currentRevision: 4 } } })]);
    const c = new FormFlowClient({ apiKey: "k", baseUrl: "http://h", fetch: f });
    await expect(c.forms.update("frm_1", { name: "x" })).rejects.toBeInstanceOf(ConflictError);
    expect(calls).toHaveLength(1);
  });
  it("gives up with RateLimitError after maxRetries", async () => {
    const { f } = fakeFetch([1, 2].map(() => json(429, { error: { code: "rate_limited", message: "x" } })));
    const c = new FormFlowClient({ apiKey: "k", baseUrl: "http://h", fetch: f, maxRetries: 1, sleep: async () => undefined });
    await expect(c.forms.get("x")).rejects.toBeInstanceOf(RateLimitError);
  });
});
