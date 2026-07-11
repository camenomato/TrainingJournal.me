"use client";

import { useEffect, useState } from "react";
import type { FuelMeal, Snapshot } from "./snapshot";

type CellState = "idle" | "sending" | "done" | "err";
type CustomMeal = FuelMeal & { id: string };

const KEY = (pid: string) => `tj-custom-meals-${pid}`;
const line = (m: FuelMeal) => `${m.meal} — ${m.portion} (~${m.kcal} kcal, ${m.proteinG} g protein)`;

// Quick meals: one-tap logging of go-to foods, plus save-your-own custom meals.
// Logging goes through the insert-only inbox (kind:"meal") — the same path as
// the notebook — or copies the line when no inbox is configured. Saved custom
// meals are cached in this browser (localStorage) so they're reusable right
// away; a "save" flag on the logged row tells /sync to add them to
// journal/meals.md, after which they arrive from the snapshot instead.
export function QuickMeals({ meals, supabase, personId }: {
  meals: FuelMeal[];
  supabase: Snapshot["supabase"];
  personId: string;
}) {
  const [custom, setCustom] = useState<CustomMeal[]>([]);
  const [cell, setCell] = useState<Record<string, CellState>>({});
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ meal: "", portion: "", kcal: "", proteinG: "" });
  const [formState, setFormState] = useState<CellState>("idle");

  // Read saved meals once on mount (not in the initializer) so server and first
  // client render agree.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY(personId));
      setCustom(raw ? JSON.parse(raw) : []);
    } catch { setCustom([]); }
  }, [personId]);

  function persist(next: CustomMeal[]) {
    setCustom(next);
    try { localStorage.setItem(KEY(personId), JSON.stringify(next)); } catch { /* private mode */ }
  }

  const mark = (k: string, s: CellState) => setCell((p) => ({ ...p, [k]: s }));

  async function send(m: FuelMeal, save: boolean): Promise<boolean> {
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

  async function logCard(k: string, m: FuelMeal) {
    mark(k, "sending");
    mark(k, (await send(m, false)) ? "done" : "err");
    setTimeout(() => mark(k, "idle"), 2500);
  }

  function removeCustom(id: string) {
    persist(custom.filter((c) => c.id !== id));
  }

  async function submit(save: boolean) {
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
    const ok = await send(meal, save);
    if (ok && save) persist([...custom, { ...meal, id: `${Date.now()}` }]);
    setFormState(ok ? "done" : "err");
    if (ok) setForm({ meal: "", portion: "", kcal: "", proteinG: "" });
    setTimeout(() => setFormState("idle"), 2500);
  }

  const cardLabel = (s: CellState | undefined) =>
    s === "sending" ? "sending…" : s === "done" ? (supabase ? "logged ✓" : "copied ✓") : s === "err" ? "retry" : "log";

  const cards: { m: FuelMeal; key: string; id?: string }[] = [
    ...meals.map((m, i) => ({ m, key: `s${i}` })),
    ...custom.map((m) => ({ m, key: `c${m.id}`, id: m.id })),
  ];

  return (
    <>
      <div className="quick-grid">
        {cards.map(({ m, key, id }) => (
          <div className="quick-meal-wrap" key={key}>
            <button
              className="quick-meal"
              data-state={cell[key] ?? "idle"}
              onClick={() => logCard(key, m)}
              disabled={cell[key] === "sending"}
              aria-label={`Log ${m.meal}`}
            >
              <span className="qm-state">{cardLabel(cell[key])}</span>
              <span className="qm-name">{m.meal}</span>
              <span className="qm-portion">{m.portion}</span>
              <span className="qm-macros">~{m.kcal} kcal · {m.proteinG} g P{id ? " · custom" : ""}</span>
            </button>
            {id && (
              <button className="qm-remove" onClick={() => removeCustom(id)} aria-label={`Remove ${m.meal}`}>×</button>
            )}
          </div>
        ))}
        <button className="quick-meal quick-add" data-open={adding} onClick={() => setAdding((a) => !a)}>
          <span className="qm-plus">＋</span>
          <span className="qm-name">Custom meal</span>
          <span className="qm-portion">save your own</span>
        </button>
      </div>

      {adding && (
        <form className="quick-form" onSubmit={(e) => { e.preventDefault(); submit(true); }}>
          <input aria-label="Meal name" placeholder="Meal (e.g. protein oats)" value={form.meal}
            onChange={(e) => setForm({ ...form, meal: e.target.value })} />
          <input aria-label="Portion" placeholder="Portion (e.g. 80 g oats · 1 scoop)" value={form.portion}
            onChange={(e) => setForm({ ...form, portion: e.target.value })} />
          <input aria-label="kcal" type="number" inputMode="numeric" placeholder="kcal" value={form.kcal}
            onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
          <input aria-label="Protein grams" type="number" inputMode="numeric" placeholder="protein g" value={form.proteinG}
            onChange={(e) => setForm({ ...form, proteinG: e.target.value })} />
          <button type="submit" className="qf-save" disabled={formState === "sending"}>Save &amp; log</button>
          <button type="button" className="qf-once" disabled={formState === "sending"} onClick={() => submit(false)}>Log once</button>
          <span className="qf-state" data-state={formState}>
            {formState === "sending" ? "…" : formState === "done" ? (supabase ? "logged ✓" : "copied ✓") : formState === "err" ? "check the fields" : ""}
          </span>
        </form>
      )}
      <p className="hint" style={{ marginTop: 8 }}>
        Saved meals live in this browser until your next sync files them into your journal.
      </p>
    </>
  );
}
