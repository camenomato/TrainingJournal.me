// PBKDF2-SHA-256 gate hash — isomorphic (browser WebCrypto + Node's global
// crypto), so the browser gate, the CLI, and the tests all share one
// implementation. The plaintext password is never stored anywhere; only
// {username, saltHex, iterations, hashHex} lives in the public snapshot.

export async function deriveGateHash(
  password: string,
  saltHex: string,
  iterations: number
): Promise<string> {
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations },
    key,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
