# TrainingJournal.me — for AI assistants

If you are Claude Code, use the skills in `.claude/skills/` — they are the
authoritative procedures. If you are another assistant (Cursor, Codex,
anything MCP-capable), this file describes the same flows in prose. The
rules in CLAUDE.md apply to every assistant; read them first.

## The flows

**Initiate (run once).** Interview the user: which trackers/apps do they
use? Configure the matching MCP servers (see docs/sources.md; verify each
with a test call). Pull real history into `journal/history.md` — sparse
real data over dense fabricated data. Then the training interview into
`journal/training.md`: knowledge level; their actual current split for
every workout type they do; for gym strength, go deep (preferred split,
days, anchor lifts, working weights); whether strength plans should carry
sets/reps/RPE/weight targets or stay list-only. Then goals into
`journal/goals.md`. Optionally: dashboard deploy, password gate
(docs/privacy.md), Supabase inbox (docs/supabase.md).

**Journal.** Dated entry in `journal/entries/YYYY-MM.md`, newest first,
append-only: what happened, how it felt, what the data said, the
decision/lesson. Record subjective-vs-objective disagreements explicitly.
Promote durable conclusions to topic files.

**Remember.** File one durable fact in the right topic file; replace stale
values in place; date time-sensitive facts; new topic → new file.

**Pull data.** On-demand MCP retrieval with the reconciliation rules from
docs/sources.md (duplicates, treadmill vs GPS, aggregate endpoints).
Compare against baselines in `journal/history.md` and call out deviations.

**Meal.** Log meals against the pre-saved library in journal/meals.md
(one line for repeat meals; honest ranges for unlisted ones). Compute the
day's calories in (state coverage), expenditure (tracker + calibrated BMR),
and balance vs target. Feed fuel into planning: surplus today = fuel
tomorrow (may nudge the suggested tier up, never past readiness gates);
deficits put fueling notes on quality sessions. Maintain
journal/analysis/fuel-performance.md pairing daily balance with later
performance markers, testing 1-5 day lags, surfacing recurring patterns as
evidence-counted hypotheses.

**Plan.** Read history + training.md + goals + current recovery baselines.
Produce a dated plan in `journal/plans/` where every session carries three
tiers (underreach / target / overreach — overreach gated on
readiness AND recovery above baseline). Strength sessions carry
sets/reps/RPE/weights only if training.md opted in. Cite the data used.
Update the dashboard snapshot (`app/snapshot.ts`).

**Sync (daily).** Read the morning's HRV, sleep score, and readiness →
drain the Supabase inbox (docs/supabase.md, or `npm run drain`) → pull
fresh daily data and append real trend points → generate today's workout
detail (three tiers, day-of only by default) → regenerate the snapshot →
`vercel deploy --prod --yes`.
