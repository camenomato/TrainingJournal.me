// Derive the password-gate hash for app/snapshot.ts. The password is read
// interactively (not from argv, so it never lands in shell history) and is
// never stored — only {username, saltHex, iterations, hashHex} is printed.
// Usage: npm run gate-hash

import { createInterface } from "node:readline/promises";
import { randomBytes, pbkdf2Sync } from "node:crypto";

const ITERATIONS = 300000;

const rl = createInterface({ input: process.stdin, output: process.stdout });
const username = (await rl.question("Username: ")).trim();
const password = await rl.question("Password (visible as you type — clear your terminal after): ");
rl.close();

const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");

console.log("\nPaste into app/snapshot.ts as the `gate` value:\n");
console.log(JSON.stringify(
  { username, saltHex: salt.toString("hex"), iterations: ITERATIONS, hashHex: hash.toString("hex") },
  null,
  2
));
