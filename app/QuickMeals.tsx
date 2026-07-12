"use client";

import { useState } from "react";
import type { FuelMeal, Snapshot } from "./snapshot";

type CellState = "idle" | "sending" | "done" | "err";
const line = (m: FuelMeal) => `${m.meal} — ${m.portion} (~${m.kcal} kcal, ${m.proteinG} g protein)`;

// Quick meals: one-tap logging of go-to foods, plus a custom-meal form. Every
// tap/submit pushes a kind:"meal" row to the insert-only Supabase inbox (drained
// to your journal at the next sync) — or copies the line when no inbox is
// configured. Custom meals are flagged save:true so the sync adds them to
// journal/meals.md; the browser stores nothing itself.
export function QuickMeals({ meals, supabase, personId }: {
  meals: FuelMeal[];
  supabase: Snapshot["supabase"];
  personId: string;
}) {
  const [cell, setCell] = useState<Record<string, CellState>>({});
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ meal: "", portion: "", kcal: "", proteinG: "" });
  const [formState, setFormState] = useState<CellState>("idle");

  const mark = (k: string, s: CellState) => setCell((p) => ({ ...p, [k]: s }));

  async function push(m: FuelMeal, save: boolean): Promise<boolean> {
    const text = line(m);
    if (!supabase) {
      try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
    }
    try {
      const res = await fetch(`${supabase.url}/rest/v1/inbox`, {
        method: "POST",
        headers: {
          apikey: supabase.anonKey,
          Authorization: `Bearer ${supabase.anonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          person: personId,
          kind: "meal",
          payload: { text, meal: m, ...(save ? { save: true } : {}) },
        }),
      });
      return res.ok;
    } catch { return false; }
  }

  async function tapCard(k: string, m: FuelMeal) {
    mark(k, "sending");
    mark(k, (await push(m, false)) ? "done" : "err");
    setTimeout(() => mark(k, "idle"), 2500);
  }

  async function submitCustom() {
    const kcalStr = form.kcal.trim();
    const proteinStr = form.proteinG.trim();
    const kcal = Number(kcalStr);
    const proteinG = Number(proteinStr);
    if (
      !form.meal.trim() || !form.portion.trim() ||
      kcalStr === "" || proteinStr === "" ||
      !Number.isFinite(kcal) || !Number.isFinite(proteinG) || kcal < 0 || proteinG < 0
    ) {
      setFormState("err");
      setTimeout(() => setFormState("idle"), 2000);
      return;
    }
    const meal: FuelMeal = { meal: form.meal.trim(), portion: form.portion.trim(), kcal, proteinG };
    setFormState("sending");
    const ok = await push(meal, true); // save:true → the sync adds it to your library
    setFormState(ok ? "done" : "err");
    if (ok) setForm({ meal: "", portion: "", kcal: "", proteinG: "" });
    setTimeout(() => setFormState("idle"), 2500);
  }

  const cardLabel = (s: CellState | undefined) =>
    s === "sending" ? "sending…" : s === "done" ? (supabase ? "logged ✓" : "copied ✓") : s === "err" ? "retry" : "log";

  return (
    <>
      <div className="quick-grid">
        {meals.map((m, i) => {
          const k = `s${i}`;
          return (
            <button
              key={k}
              className="quick-meal"
              data-state={cell[k] ?? "idle"}
              onClick={() => tapCard(k, m)}
              disabled={cell[k] === "sending"}
              aria-label={`Log ${m.meal}`}
            >
              <span className="qm-state">{cardLabel(cell[k])}</span>
              <span className="qm-name">{m.meal}</span>
              <span className="qm-portion">{m.portion}</span>
              <span className="qm-macros">~{m.kcal} kcal · {m.proteinG} g P</span>
            </button>
          );
        })}
        <button className="quick-meal quick-add" data-open={adding} onClick={() => setAdding((a) => !a)}>
          <span className="qm-plus">＋</span>
          <span className="qm-name">Custom meal</span>
          <span className="qm-portion">log a new one</span>
        </button>
      </div>

      {adding && (
        <form className="quick-form" onSubmit={(e) => { e.preventDefault(); submitCustom(); }}>
          <input aria-label="Meal name" placeholder="Meal (e.g. protein oats)" value={form.meal}
            onChange={(e) => setForm({ ...form, meal: e.target.value })} />
          <input aria-label="Portion" placeholder="Portion (e.g. 80 g oats · 1 scoop)" value={form.portion}
            onChange={(e) => setForm({ ...form, portion: e.target.value })} />
          <input aria-label="kcal" type="number" inputMode="numeric" placeholder="kcal" value={form.kcal}
            onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
          <input aria-label="Protein grams" type="number" inputMode="numeric" placeholder="protein g" value={form.proteinG}
            onChange={(e) => setForm({ ...form, proteinG: e.target.value })} />
          <button type="submit" className="qf-save" disabled={formState === "sending"}>
            {supabase ? "Log to inbox" : "Copy line"}
          </button>
          <span className="qf-state" data-state={formState}>
            {formState === "sending" ? "…" : formState === "done" ? (supabase ? "logged ✓" : "copied ✓") : formState === "err" ? "check the fields" : ""}
          </span>
        </form>
      )}
      <p className="hint" style={{ marginTop: 8 }}>
        {supabase
          ? "Tapping logs the meal to your inbox; a custom meal is added to your library at the next sync."
          : "No inbox configured — tapping copies the meal line for your agent."}
      </p>
    </>
  );
}
