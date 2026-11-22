/** OpenPGP option for answer encryption (A15). Loaded on demand so the openpgp library only ships to forms that use it. */
type OpenPgp = typeof import("openpgp");
let openpgpLib: Promise<OpenPgp> | undefined;
const loadOpenpgp = (): Promise<OpenPgp> => (openpgpLib ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ /* @vite-ignore */ "openpgp" as string) as Promise<OpenPgp>);

export const MAX_PGP_KEY = 16_000;

/** Parses an armored public key and returns its fingerprint. Rejects private keys, keys that cannot encrypt, expired or revoked keys, and oversize input. */
export async function parsePgpPublicKey(armored: string): Promise<{ fingerprint: string; userIds: string[] }> {
  const openpgp = await loadOpenpgp();
  if (typeof armored !== "string" || armored.length > MAX_PGP_KEY) throw new Error("PGP key is too large");
  if (/PRIVATE KEY BLOCK/.test(armored)) throw new Error("That is a private key. Paste the public key only");
  const key = await openpgp.readKey({ armoredKey: armored });
  if (key.isPrivate()) throw new Error("That is a private key. Paste the public key only");
  await key.getEncryptionKey(); // throws when no usable encryption subkey exists (signing-only, expired or revoked)
  return { fingerprint: key.getFingerprint().toUpperCase(), userIds: key.getUserIDs() };
}

/** Encrypts JSON.stringify(value) to the key and returns the armored message. */
export async function encryptPgp(armoredPublicKey: string, value: unknown): Promise<string> {
  const openpgp = await loadOpenpgp();
  const encryptionKeys = await openpgp.readKey({ armoredKey: armoredPublicKey });
  const message = await openpgp.createMessage({ text: JSON.stringify(value) });
  return (await openpgp.encrypt({ message, encryptionKeys, format: "armored" })) as string;
}

/** Opens a message with an armored private key (and its passphrase if it has one). For tests and tools that hold the owner's key. */
export async function decryptPgp(armoredPrivateKey: string, armoredMessage: string, passphrase?: string): Promise<unknown> {
  const openpgp = await loadOpenpgp();
  let privateKey = await openpgp.readPrivateKey({ armoredKey: armoredPrivateKey });
  if (!privateKey.isDecrypted()) privateKey = await openpgp.decryptKey({ privateKey, passphrase: passphrase ?? "" });
  const { data } = await openpgp.decrypt({ message: await openpgp.readMessage({ armoredMessage }), decryptionKeys: privateKey });
  return JSON.parse(String(data));
}
