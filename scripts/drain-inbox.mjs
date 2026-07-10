// Drain the Supabase inbox into journal/entries/ — idempotently — then
// delete the drained rows. See docs/supabase.md for the contract.
// Usage: npm run drain   (needs SUPABASE_URL + SUPABASE_SERVICE_KEY in env
// or .env.local; the service key must NEVER be committed or deployed.)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function entryMarker(id) {
  return `<!-- inbox:${id} -->`;
}

export function formatEntry(row) {
  const kindTag = row.kind === "journal" ? "" : ` — ${row.kind}`;
  const text = typeof row.payload?.text === "string" ? row.payload.text.trim() : JSON.stringify(row.payload);
  return `${entryMarker(row.id)}\nVia notebook${kindTag}: ${text}`;
}

// Merge one inbox row into a month file's content. Idempotent: if the row's
// id marker is already present, content is returned unchanged. New entries
// go under their date heading (created if missing, newest-first ordering).
export function mergeRow(content, row) {
  if (content.includes(entryMarker(row.id))) return { content, added: false };
  const date = row.created_at.slice(0, 10);
  const heading = `## ${date}`;
  const entry = formatEntry(row);

  if (content.includes(heading)) {
    const idx = content.indexOf(heading) + heading.length;
    return { content: content.slice(0, idx) + `\n\n${entry}` + content.slice(idx), added: true };
  }
  const [y, m] = date.split("-");
  const title = `# Journal — ${MONTHS[Number(m) - 1]} ${y}`;
  let base = content.trim();
  if (!base) base = title;
  // newest-first: new date headings go right after the # title line
  const lines = base.split("\n");
  const titleEnd = lines[0].startsWith("# ") ? 1 : 0;
  const head = lines.slice(0, titleEnd).join("\n") || title;
  const rest = lines.slice(titleEnd).join("\n").trim();
  return {
    content: `${head}\n\n${heading}\n\n${entry}${rest ? `\n\n${rest}` : ""}\n`,
    added: true,
  };
}

export function monthFileFor(row, repoRoot) {
  const ym = row.created_at.slice(0, 7);
  const person = row.person && row.person !== "me" ? row.person : null;
  const dir = person ? join(repoRoot, "journal", "people", person, "entries") : join(repoRoot, "journal", "entries");
  return join(dir, `${ym}.md`);
}

async function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  loadDotEnvLocal(root);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — nothing to drain (see docs/supabase.md).");
    process.exit(1);
  }
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const res = await fetch(`${url}/rest/v1/inbox?select=*`, { headers });
  if (!res.ok) throw new Error(`inbox read failed: ${res.status}`);
  const rows = await res.json();
  if (rows.length === 0) {
    console.log("Inbox empty — steady state.");
    return;
  }

  const drained = [];
  for (const row of rows) {
    const file = monthFileFor(row, root);
    mkdirSync(dirname(file), { recursive: true });
    const before = existsSync(file) ? readFileSync(file, "utf8") : "";
    const { content, added } = mergeRow(before, row);
    if (added) writeFileSync(file, content);
    drained.push(row.id); // already-present rows are safe to delete too
  }

  const del = await fetch(`${url}/rest/v1/inbox?id=in.(${drained.join(",")})`, { method: "DELETE", headers });
  if (!del.ok) throw new Error(`inbox delete failed after storing locally: ${del.status} — rows remain in the inbox; rerun (idempotent).`);
  console.log(`Drained ${drained.length} entr${drained.length === 1 ? "y" : "ies"}; inbox cleared.`);
}

function loadDotEnvLocal(root) {
  const p = join(root, ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
