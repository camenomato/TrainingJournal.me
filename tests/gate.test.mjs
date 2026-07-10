import { test } from "node:test";
import assert from "node:assert/strict";
import { pbkdf2Sync } from "node:crypto";

// The app's gate module is TypeScript; replicate its exact derivation here
// and cross-check against Node's independent PBKDF2 implementation, so a
// drift in either direction fails the suite. Parameters must match
// scripts/derive-gate-hash.mjs and app/gate.ts.
async function deriveViaWebCrypto(password, saltHex, iterations) {
  const enc = new TextEncoder();
  const salt = Uint8Array.from(saltHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return Buffer.from(bits).toString("hex");
}

const SALT = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
const ITER = 10000; // small for test speed; production uses 300000

test("browser-style WebCrypto derivation matches Node's pbkdf2 exactly", async () => {
  const web = await deriveViaWebCrypto("correct horse battery staple", SALT, ITER);
  const node = pbkdf2Sync("correct horse battery staple", Buffer.from(SALT, "hex"), ITER, 32, "sha256").toString("hex");
  assert.equal(web, node);
});

test("wrong password produces a different hash", async () => {
  const right = await deriveViaWebCrypto("open sesame", SALT, ITER);
  const wrong = await deriveViaWebCrypto("open sesame ", SALT, ITER);
  assert.notEqual(right, wrong);
});

test("same password with a different salt produces a different hash", async () => {
  const a = await deriveViaWebCrypto("open sesame", SALT, ITER);
  const b = await deriveViaWebCrypto("open sesame", "00112233445566778899aabbccddeeff", ITER);
  assert.notEqual(a, b);
});
