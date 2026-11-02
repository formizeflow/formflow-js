// Copy of src/modules/compliance/e2e.ts so the published SDK has no import into the app. Keep the two files identical below this line.
/**
 * End-to-end style encryption (A15). Marked answers are encrypted in the respondent's browser with the form's public key
 * (RSA-OAEP-SHA256 wrapping a fresh AES-256-GCM key per value). The server stores only the public key and the ciphertext; the private
 * key stays with the form owner. WebCrypto only, so the same code runs in the browser, in Node and in the SDKs.
 * Envelope: "ffenc1." + base64url(JSON {v, kid, k, iv, ct}). Plain RSA-OAEP, no PGP: see docs/encryption.md for why.
 */
const subtle = (): SubtleCrypto => globalThis.crypto.subtle;
const enc = new TextEncoder(), dec = new TextDecoder();
export const ENVELOPE_PREFIX = "ffenc1.";
export const MAX_ENVELOPE = 60_000;
const RSA = { name: "RSA-OAEP", hash: "SHA-256" } as const;

export type PublicKeyJwk = { kty: "RSA"; n: string; e: string; alg?: string; ext?: boolean; key_ops?: string[] };
export type PrivateKeyJwk = PublicKeyJwk & { d: string; p?: string; q?: string; dp?: string; dq?: string; qi?: string };
export type EncryptionConfig = { publicKeyJwk: PublicKeyJwk; keyId: string; fieldIds: string[] };

const b64 = (b: ArrayBuffer | Uint8Array): string => { const u = b instanceof Uint8Array ? b : new Uint8Array(b); let s = ""; for (const x of u) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64 = (s: string): Uint8Array<ArrayBuffer> => { const p = atob(s.replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(p.length); for (let i = 0; i < p.length; i++) u[i] = p.charCodeAt(i); return u; };

/** Short fingerprint of the public modulus, stored with the key so a mismatched private key is reported clearly. */
export async function keyIdOf(pub: PublicKeyJwk): Promise<string> {
  return b64(await subtle().digest("SHA-256", enc.encode(`${pub.e}.${pub.n}`))).slice(0, 16);
}

export async function generateKeyPair(): Promise<{ publicKeyJwk: PublicKeyJwk; privateKeyJwk: PrivateKeyJwk; keyId: string }> {
  const kp = await subtle().generateKey({ ...RSA, modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]) }, true, ["encrypt", "decrypt"]);
  const pub = (await subtle().exportKey("jwk", kp.publicKey)) as PublicKeyJwk, priv = (await subtle().exportKey("jwk", kp.privateKey)) as PrivateKeyJwk;
  const clean = ({ kty, n, e }: PublicKeyJwk): PublicKeyJwk => ({ kty, n, e });
  return { publicKeyJwk: clean(pub), privateKeyJwk: { ...priv, key_ops: undefined, ext: undefined } as PrivateKeyJwk, keyId: await keyIdOf(pub) };
}

const importPub = (j: PublicKeyJwk) => subtle().importKey("jwk", { kty: "RSA", n: j.n, e: j.e, alg: "RSA-OAEP-256", ext: true }, RSA, false, ["encrypt"]);
const importPriv = (j: PrivateKeyJwk) => subtle().importKey("jwk", { ...j, alg: "RSA-OAEP-256", ext: true }, RSA, false, ["decrypt"]);

export async function encryptBytes(pub: PublicKeyJwk, data: Uint8Array, kid?: string): Promise<{ v: 1; kid: string; k: string; iv: string; ct: string }> {
  const aes = await subtle().generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle().encrypt({ name: "AES-GCM", iv }, aes, data as BufferSource);
  const wrapped = await subtle().encrypt({ name: "RSA-OAEP" }, await importPub(pub), await subtle().exportKey("raw", aes));
  return { v: 1, kid: kid ?? await keyIdOf(pub), k: b64(wrapped), iv: b64(iv), ct: b64(ct) };
}
export async function decryptBytes(priv: PrivateKeyJwk, box: { k: string; iv: string; ct: string }): Promise<Uint8Array> {
  const raw = await subtle().decrypt({ name: "RSA-OAEP" }, await importPriv(priv), unb64(box.k));
  const aes = await subtle().importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  return new Uint8Array(await subtle().decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, aes, unb64(box.ct)));
}

export const isEnvelope = (v: unknown): v is string => typeof v === "string" && v.startsWith(ENVELOPE_PREFIX) && v.length <= MAX_ENVELOPE && /^[A-Za-z0-9_-]+$/.test(v.slice(ENVELOPE_PREFIX.length));

export async function encryptValue(pub: PublicKeyJwk, value: unknown, kid?: string): Promise<string> {
  const box = await encryptBytes(pub, enc.encode(JSON.stringify(value)), kid);
  return ENVELOPE_PREFIX + b64(enc.encode(JSON.stringify(box)));
}
export async function decryptValue(priv: PrivateKeyJwk, envelope: string): Promise<unknown> {
  if (!isEnvelope(envelope)) throw new Error("Not an encrypted value");
  return JSON.parse(dec.decode(await decryptBytes(priv, JSON.parse(dec.decode(unb64(envelope.slice(ENVELOPE_PREFIX.length)))))));
}

const empty = (v: unknown) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
/** Replaces the marked fields' values with envelopes; empty values stay empty so required checks still work. */
export async function encryptAnswers<T extends Record<string, unknown>>(cfg: EncryptionConfig, answers: T): Promise<T> {
  const out: Record<string, unknown> = { ...answers };
  for (const id of cfg.fieldIds) if (id in out && !empty(out[id]) && !isEnvelope(out[id])) out[id] = await encryptValue(cfg.publicKeyJwk, out[id], cfg.keyId);
  return out as T;
}
/** Decrypts every envelope found in the answers (also inside repeating-section rows). Values that cannot be opened stay as they are. */
export async function decryptAnswers<T>(priv: PrivateKeyJwk, answers: T): Promise<T> {
  const walk = async (v: unknown): Promise<unknown> => {
    if (isEnvelope(v)) { try { return await decryptValue(priv, v); } catch { return v; } }
    if (Array.isArray(v)) return Promise.all(v.map(walk));
    if (v && typeof v === "object") return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await walk(x)])));
    return v;
  };
  return (await walk(answers)) as T;
}
