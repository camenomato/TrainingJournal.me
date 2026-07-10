"use client";

import { useState } from "react";
import { snapshot, type PersonData, type Session, type Tier } from "./snapshot";
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

export default function Page() {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (!snapshot.gate) return true;
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tj-unlock") === snapshot.gate.hashHex;
  });
  const [personIdx, setPersonIdx] = useState(0);

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} />;

  const person = snapshot.people[personIdx];
  const d = person.data;
  const today = d.week.find((s) => s.status === "today");

  return (
    <div className="wrap">
      <header className="site">
        <div className="wordmark">TRAINING<span>JOURNAL</span></div>
        <span className="sub">local-first<br />updated {snapshot.updatedAt}</span>
      </header>

      {snapshot.people.length > 1 && (
        <div className="person-switch">
          {snapshot.people.map((p, i) => (
            <button key={p.id} data-active={i === personIdx} onClick={() => setPersonIdx(i)}>{p.name}</button>
          ))}
        </div>
      )}

      <div className="card hero">
        <div className="bib">{d.headline.label}</div>
        <span className="hint" style={{ textTransform: "uppercase", letterSpacing: ".12em" }}>Current fitness says</span>
        <div className="hero-num">{d.headline.value}</div>
        <p className="why" style={{ margin: "6px 0 0" }}>{d.headline.detail}</p>
      </div>

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

      {(() => {
        const upNext = d.week.find((s) => s.status === "upcoming" && s.tiers);
        return upNext ? (
          <>
            <h2 className="section">Up next</h2>
            <SessionCard session={upNext} data={d} />
          </>
        ) : null;
      })()}

      <h2 className="section">Trends</h2>
      <div className="metric-grid">
        {d.metrics.map((m) => (
          <TrendChart
            key={m.key}
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
        ))}
      </div>

      <h2 className="section">Notebook</h2>
      <Notebook
        supabase={snapshot.supabase}
        people={snapshot.people.map((p) => ({ id: p.id, name: p.name }))}
        defaultPerson={person.id}
      />

      <h2 className="section">Coach</h2>
      <div className="coach">
        <div className="pin" />
        <p>&ldquo;{d.coachNote}&rdquo;</p>
      </div>
    </div>
  );
}
