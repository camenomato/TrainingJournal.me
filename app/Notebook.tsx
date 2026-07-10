"use client";

import { useState } from "react";
import type { Snapshot } from "./snapshot";

// Browser-side journal input. With Supabase configured it inserts into the
// insert-only inbox (drained to your journal on the next sync). Without it,
// the entry is handed back to the user for their agent — a static site with
// no backend has nowhere else to write.
export function Notebook({ supabase, people, defaultPerson }: {
  supabase: Snapshot["supabase"];
  people: { id: string; name: string }[];
  defaultPerson: string;
}) {
  const [text, setText] = useState("");
  const [person, setPerson] = useState(defaultPerson);
  const [kind, setKind] = useState<"journal" | "checkin" | "coach-note">("journal");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send() {
    if (!supabase || !text.trim()) return;
    setState("sending");
    try {
      const res = await fetch(`${supabase.url}/rest/v1/inbox`, {
        method: "POST",
        headers: {
          apikey: supabase.anonKey,
          Authorization: `Bearer ${supabase.anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ person, kind, payload: { text: text.trim() } }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setText("");
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="card notebook">
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); if (state !== "idle") setState("idle"); }}
        placeholder="What happened, and how did it feel? Entries land in your journal at the next sync."
      />
      <div className="row">
        {people.length > 1 && (
          <select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Person">
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="Entry kind">
          <option value="journal">journal</option>
          <option value="checkin">check-in</option>
          <option value="coach-note">coach note</option>
        </select>
        {supabase ? (
          <button className="send" onClick={send} disabled={state === "sending" || !text.trim()}>
            {state === "sending" ? "Sending…" : "Send to inbox"}
          </button>
        ) : (
          <span className="hint">No cloud inbox configured — copy this text to your agent, or set up the inbox (docs/supabase.md).</span>
        )}
      </div>
      {state === "sent" && <p className="hint">In the inbox — it reaches your journal at the next sync.</p>}
      {state === "error" && <p className="err">Couldn&apos;t reach the inbox — check the Supabase URL/key, or paste the entry to your agent instead.</p>}
    </div>
  );
}
