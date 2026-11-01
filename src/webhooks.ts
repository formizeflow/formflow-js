/** Webhook signature verification. Scheme: `FormFlow-Signature: t=<unix>,v1=<hex hmac-sha256 of "t.payload">`. WebCrypto only. */
const enc = new TextEncoder();

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signWebhookPayload(payload: string, secret: string, timestamp: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${payload}`)));
}

/**
 * Resolves true only when a v1 signature matches and the timestamp is within `toleranceSec` (default 300s).
 * Pass the RAW request body string, not re-serialized JSON.
 */
export async function verifyWebhookSignature(payload: string, header: string | null | undefined, secret: string, toleranceSec = 300, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  if (!Number.isFinite(t) || Math.abs(nowSec - t) > toleranceSec) return false;
  const expected = await signWebhookPayload(payload, secret, t);
  return parts.some(([k, v]) => k === "v1" && typeof v === "string" && constantTimeEqual(v, expected));
}
