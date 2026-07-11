"use client";

import { useEffect, useState } from "react";
import { snapshot, type Person, type PersonData, type Session, type Source, type Tier } from "./snapshot";
import { TrendChart } from "./TrendChart";
import { Notebook } from "./Notebook";
import { deriveGateHash } from "./gate";

const TIER_LABELS: Record<Tier, string> = {
  under: "Underreach · not feeling 100",
  target: "Target",
  over: "Overreach · feeling 200",
};

// Suggested tier, derived at view time from today's recovery signals — never
// precomputed into the snapshot. Readiness and HRV vs their averages decide.
function computeSuggestedTier(d: PersonData): Tier {
  const readiness = d.metrics.find((m) => m.key === "readiness");
  const hrv = d.metrics.find((m) => m.key === "hrv");
  if (!readiness) return "target";
  const hrvOk = !hrv || hrv.current >= (hrv.weeklyAverage ?? hrv.current);
  if (readiness.current >= 70 && hrvOk) return "over";
  if (readiness.current < 50 || !hrvOk) return "under";
  return "target";
}

// A source is "stale" when its last sync predates the snapshot date — an
// honest nudge that one input didn't refresh with the others.
function isStale(lastSync: string) {
  return lastSync.slice(0, 10) < snapshot.updatedAt;
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const gate = snapshot.gate!;
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const hash = await deriveGateHash(pass, gate.saltHex, gate.iterations);
    if (user.trim() === gate.username && hash === gate.hashHex) {
      localStorage.setItem("tj-unlock", hash);
      onUnlock();
    } else {
      setErr(true);
      setBusy(false);
    }
  }

  return (
    <form className="gate" onSubmit={submit}>
      <div className="wordmark">TRAINING<span>JOURNAL</span></div>
      <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Username" autoComplete="username" />
      <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" type="password" autoComplete="current-password" />
      <button type="submit" disabled={busy}>{busy ? "Checking…" : "Unlock"}</button>
      {err && <p className="err">That&apos;s not it.</p>}
    </form>
  );
}

// Each connected input and when it last refreshed. Stale inputs are flagged.
function SourcesPanel({ sources }: { sources: Source[] }) {
  return (
    <div className="sources">
      {sources.map((s) => (
        <div key={s.name} className="source" data-stale={isStale(s.lastSync)}>
          <span className="src-name">{s.name}</span>
          <span className="src-detail">{s.detail}</span>
          <span className="src-sync">
            synced {s.lastSync}{isStale(s.lastSync) ? " · stale" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

function SessionCard({ session, data }: { session: Session; data: PersonData }) {
  const suggested = session.status === "today" && !session.note ? computeSuggestedTier(data) : "target";
  const [tier, setTier] = useState<Tier>(session.tiers?.[suggested] ? suggested : "target");
  const detail = session.tiers?.[tier];

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div className="tag">
        {session.status === "today" ? "Today" : session.day} — {session.label}
      </div>
      {session.note && <p className="note">{session.note}</p>}
      {session.tiers && (
        <div className="tier-row">
          {(Object.keys(TIER_LABELS) as Tier[]).map((t) =>
            session.tiers?.[t] ? (
              <button key={t} className="tier-pill" data-active={t === tier} onClick={() => setTier(t)}>
                {TIER_LABELS[t]}{t === suggested && session.status === "today" ? " ●" : ""}
              </button>
            ) : null
          )}
          {session.status === "today" && session.tiers[suggested] && (
            <span className="suggest-note">● suggested from today&apos;s readiness &amp; HRV</span>
          )}
        </div>
      )}
      {detail && (
        <>
          <h3 style={{ margin: "6px 0 2px" }}>{detail.title}</h3>
          <p className="hint" style={{ marginTop: 0 }}>{detail.meta}</p>
          {detail.segments && (
            <div className="segbar">
              {detail.segments.map((s, i) => (
                <div key={i} className={`seg ${s.intensity}`} style={{ flexBasis: `${s.widthPct}%` }}>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          )}
          {detail.strength && (
            <table className="strength">
              <thead>
                <tr><th>Exercise</th><th>Sets</th><th>Reps</th><th>RPE</th><th>Weight</th></tr>
              </thead>
              <tbody>
                {detail.strength.map((s, i) => (
                  <tr key={i}><td>{s.exercise}</td><td>{s.sets}</td><td>{s.reps}</td><td>{s.rpe ?? "—"}</td><td>{s.weight ?? "—"}</td></tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="why">{detail.why}</p>
        </>
      )}
      {!detail && !session.note && session.kind !== "rest" && session.status === "upcoming" && (
        <p className="hint">Full detail lands the morning of — workouts are generated day-of from that day&apos;s readiness.</p>
      )}
    </div>
  );
}

// Everyone at a glance — the household / training-partner view. Reads across
// all people rather than switching between them. Most useful with 2+.
function Together({ people }: { people: Person[] }) {
  return (
    <>
      <h2 className="section">Together</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Everyone in this snapshot, side by side. Each column is that person&apos;s own
        secret-free snapshot — nobody sees another&apos;s raw journal or health data.
      </p>
      <div className="together-grid">
        {people.map((p) => {
          const d = p.data;
          const today = d.week.find((s) => s.status === "today");
          const suggested = today ? computeSuggestedTier(d) : null;
          const readiness = d.metrics.find((m) => m.key === "readiness");
          const topGoal = d.goals?.[0];
          const latest = d.sources
            ? [...d.sources].map((s) => s.lastSync).sort().at(-1)
            : null;
          const anyStale = d.sources?.some((s) => isStale(s.lastSync));

          return (
            <div key={p.id} className="tog-card">
              <div className="tog-head">
                <span className="tog-name">{p.name}</span>
                {latest && (
                  <span className="tog-sync" data-stale={anyStale}>
                    synced {latest}{anyStale ? " ·⚠" : ""}
                  </span>
                )}
              </div>

              <div className="tog-row">
                <span className="k">{d.headline.label}</span>
                <span className="v">{d.headline.value}</span>
              </div>

              {readiness && (
                <div className="tog-row">
                  <span className="k">{readiness.label}</span>
                  <span
                    className="v"
                    style={{
                      color:
                        readiness.weeklyAverage !== undefined && readiness.current < readiness.weeklyAverage
                          ? "var(--mod)"
                          : "var(--track)",
                    }}
                  >
                    {readiness.current}
                    {readiness.weeklyAverage !== undefined ? ` (avg ${readiness.weeklyAverage})` : ""}
                  </span>
                </div>
              )}

              {today && (
                <div className="tog-row">
                  <span className="k">Today</span>
                  <span className="v">
                    {today.label}
                    {suggested ? ` · ${suggested === "over" ? "overreach" : suggested === "under" ? "underreach" : "target"}` : ""}
                  </span>
                </div>
              )}

              {topGoal && (
                <div className="tog-goal">
                  <div className="tog-row" style={{ marginBottom: 4 }}>
                    <span className="k">{topGoal.label}</span>
                    <span className="v">{topGoal.current} → {topGoal.target}</span>
                  </div>
                  <div className="goal-bar"><div style={{ width: `${topGoal.progressPct}%` }} /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

type TabId = "today" | "goals" | "trends" | "fuel" | "log" | "together";

export default function Page() {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (!snapshot.gate) return true;
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tj-unlock") === snapshot.gate.hashHex;
  });
  const [personIdx, setPersonIdx] = useState(0);
  const [tab, setTab] = useState<TabId>("today");

  // Deep links: `#goals` selects a tab, `#goals.kratos` a tab + person. Read
  // once on mount (never in the useState initializer) so server and first
  // client render agree — no hydration mismatch.
  useEffect(() => {
    const raw = window.location.hash.slice(1);
    if (!raw) return;
    const [t, pid] = raw.split(".");
    if (["today", "goals", "trends", "fuel", "log", "together"].includes(t)) setTab(t as TabId);
    if (pid) {
      const i = snapshot.people.findIndex((p) => p.id === pid);
      if (i >= 0) setPersonIdx(i);
    }
  }, []);

  function pickTab(id: TabId) {
    setTab(id);
    const p = snapshot.people[personIdx];
    history.replaceState(null, "", `#${id}${personIdx > 0 ? `.${p.id}` : ""}`);
  }

  function pickPerson(i: number) {
    setPersonIdx(i);
    history.replaceState(null, "", `#${tab}${i > 0 ? `.${snapshot.people[i].id}` : ""}`);
  }

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} />;

  const person = snapshot.people[personIdx];
  const d = person.data;
  const today = d.week.find((s) => s.status === "today");
  const upNext = d.week.find((s) => s.status === "upcoming" && s.tiers);

  // Tabs are the union across people, so a sparse snapshot never shows an
  // empty tab. Together only appears when there's more than one person.
  const anyGoals = snapshot.people.some((p) => (p.data.goals?.length ?? 0) > 0);
  const anyFuel = snapshot.people.some((p) => !!p.data.fuel);
  const multi = snapshot.people.length > 1;
  const tabs: { id: TabId; label: string }[] = [
    { id: "today", label: "Today" },
    ...(anyGoals ? [{ id: "goals" as TabId, label: "Goals" }] : []),
    { id: "trends", label: "Trends" },
    ...(anyFuel ? [{ id: "fuel" as TabId, label: "Fuel" }] : []),
    { id: "log", label: "Log" },
    ...(multi ? [{ id: "together" as TabId, label: "Together" }] : []),
  ];

  return (
    <div className="wrap">
      <header className="site">
        <div className="wordmark">TRAINING<span>JOURNAL</span></div>
        <span className="sub">local-first<br />updated {snapshot.updatedAt}</span>
      </header>

      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className="tab" data-active={t.id === tab} onClick={() => pickTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab !== "together" && multi && (
        <div className="person-switch">
          {snapshot.people.map((p, i) => (
            <button key={p.id} data-active={i === personIdx} onClick={() => pickPerson(i)}>{p.name}</button>
          ))}
        </div>
      )}

      {tab === "today" && (
        <>
          <div className="card hero">
            <div className="bib">{d.headline.label}</div>
            <span className="hint" style={{ textTransform: "uppercase", letterSpacing: ".12em" }}>Current fitness says</span>
            <div className="hero-num">{d.headline.value}</div>
            <p className="why" style={{ margin: "6px 0 0" }}>{d.headline.detail}</p>
          </div>

          {d.sources && d.sources.length > 0 && (
            <>
              <h2 className="section">Inputs · last sync</h2>
              <SourcesPanel sources={d.sources} />
            </>
          )}

          <h2 className="section">This week</h2>
          <div className="week-strip">
            {d.week.map((s) => (
              <div key={s.date} className="week-day" data-today={s.status === "today"} data-status={s.status}>
                <div className="d">{s.day}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>

          {today && (
            <>
              <h2 className="section">Today</h2>
              <SessionCard session={today} data={d} />
            </>
          )}

          {upNext && (
            <>
              <h2 className="section">Up next</h2>
              <SessionCard session={upNext} data={d} />
            </>
          )}

          <h2 className="section">Coach</h2>
          <div className="coach">
            <div className="pin" />
            <p>&ldquo;{d.coachNote}&rdquo;</p>
          </div>
        </>
      )}

      {tab === "goals" && (
        <>
          <h2 className="section">Goals</h2>
          {d.goals && d.goals.length > 0 ? (
            <div className="goal-grid">
              {d.goals.map((g) => (
                <div key={g.label} className="card">
                  <div className="tag">{g.kind}</div>
                  <h3>{g.label}</h3>
                  <div className="goal-nums">
                    <span>{g.current}</span>
                    <span className="arrow">→</span>
                    <span className="want">{g.target}</span>
                  </div>
                  <div className="goal-bar">
                    <div style={{ width: `${g.progressPct}%` }} />
                  </div>
                  <p className="why" style={{ margin: "8px 0 0" }}>{g.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="hint">No goals recorded for {person.name} yet — run /initiate.</p>
          )}
        </>
      )}

      {tab === "trends" && (
        <>
          <h2 className="section">Trends</h2>
          <div className="metric-grid">
            {d.metrics.map((m) => {
              const sync = m.source ? d.sources?.find((s) => s.name === m.source)?.lastSync : undefined;
              return (
                <div key={m.key}>
                  <TrendChart
                    data={m.trend}
                    label={m.label}
                    unit={m.unit}
                    decimals={m.decimals ?? 0}
                    defaultWindowDays={30}
                    today={snapshot.updatedAt}
                    color={
                      m.weeklyAverage !== undefined &&
                      (m.higherIsBetter ? m.current < m.weeklyAverage : m.current > m.weeklyAverage)
                        ? "var(--mod)"
                        : "var(--track)"
                    }
                  />
                  {m.source && (
                    <p className="src-cap" data-stale={sync ? isStale(sync) : false}>
                      via {m.source}{sync ? ` · synced ${sync}` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "fuel" && (
        <>
          <h2 className="section">Fuel</h2>
          {d.fuel ? (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="tag">{d.fuel.dayLabel}</div>
              <table className="strength fuel-table">
                <thead>
                  <tr><th>Meal</th><th>Portion</th><th>kcal</th><th>Protein</th></tr>
                </thead>
                <tbody>
                  {d.fuel.meals.map((m, i) => (
                    <tr key={i}><td>{m.meal}</td><td>{m.portion}</td><td>{m.kcal}</td><td>{m.proteinG} g</td></tr>
                  ))}
                  <tr className="total">
                    <td>Planned</td>
                    <td className="hint">target {d.fuel.targetKcal} kcal · protein floor {d.fuel.proteinFloorG} g</td>
                    <td>{d.fuel.meals.reduce((s, m) => s + m.kcal, 0)}</td>
                    <td>{d.fuel.meals.reduce((s, m) => s + m.proteinG, 0)} g</td>
                  </tr>
                </tbody>
              </table>
              <p className="why" style={{ margin: "4px 0 0" }}>{d.fuel.note}</p>
            </div>
          ) : (
            <p className="hint">No meal plan for {person.name} yet — log meals or run /initiate.</p>
          )}
        </>
      )}

      {tab === "log" && (
        <>
          <h2 className="section">Notebook</h2>
          <Notebook
            supabase={snapshot.supabase}
            people={snapshot.people.map((p) => ({ id: p.id, name: p.name }))}
            defaultPerson={person.id}
          />
        </>
      )}

      {tab === "together" && <Together people={snapshot.people} />}
    </div>
  );
}
