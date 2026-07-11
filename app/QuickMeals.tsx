"use client";

import { useState } from "react";
import type { FuelMeal, Snapshot } from "./snapshot";

type CellState = "idle" | "sending" | "done" | "err";

// One-tap logging of go-to meals. With Supabase configured it inserts a
// kind:"meal" row into the insert-only inbox (drained to your journal at the
// next sync). Without it, it copies the meal line so you can hand it to your
// agent — same fallback as the notebook. Never stores anything itself.
export function QuickMeals({ meals, supabase, personId }: {
  meals: FuelMeal[];
  supabase: Snapshot["supabase"];
  personId: string;
}) {
  const [state, setState] = useState<Record<number, CellState>>({});
  const set = (i: number, s: CellState) => setState((prev) => ({ ...prev, [i]: s }));

  async function log(i: number, m: FuelMeal) {
    const text = `${m.meal} — ${m.portion} (~${m.kcal} kcal, ${m.proteinG} g protein)`;

    if (!supabase) {
      try { await navigator.clipboard.writeText(text); set(i, "done"); }
      catch { set(i, "err"); }
      setTimeout(() => set(i, "idle"), 2500);
      return;
    }

    set(i, "sending");
    try {
      const res = await fetch(`${supabase.url}/rest/v1/inbox`, {
        method: "POST",
        headers: {
          apikey: supabase.anonKey,
          Authorization: `Bearer ${supabase.anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ person: personId, kind: "meal", payload: { text } }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      set(i, "done");
    } catch {
      set(i, "err");
    }
    setTimeout(() => set(i, "idle"), 2500);
  }

  const label = (s: CellState | undefined) =>
    s === "sending" ? "sending…"
    : s === "done" ? (supabase ? "logged ✓" : "copied ✓")
    : s === "err" ? "retry"
    : "log";

  return (
    <div className="quick-grid">
      {meals.map((m, i) => (
        <button
          key={i}
          className="quick-meal"
          data-state={state[i] ?? "idle"}
          onClick={() => log(i, m)}
          disabled={state[i] === "sending"}
          aria-label={`Log ${m.meal}`}
        >
          <span className="qm-state">{label(state[i])}</span>
          <span className="qm-name">{m.meal}</span>
          <span className="qm-portion">{m.portion}</span>
          <span className="qm-macros">~{m.kcal} kcal · {m.proteinG} g P</span>
        </button>
      ))}
    </div>
  );
}
