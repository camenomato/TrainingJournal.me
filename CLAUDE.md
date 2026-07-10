# TrainingJournal.me — agent rules

This repo is a personal training journal + planner. `journal/` is the user's
private data and the single source of truth. Rules for every session:

- **Facts only.** Never invent, embellish, or interpolate personal data or
  metrics. Sparse real data beats dense fabricated data. Unknown → ask, or
  leave a `(fill in)` placeholder.
- **Local-first.** Credentials and raw data never leave this machine. The
  dashboard deploy is a static, secret-free snapshot. The optional Supabase
  inbox is insert-only from the browser and drained to zero on every sync.
- **Journal is append-only.** Corrections are new dated entries referencing
  the old one. Durable conclusions get promoted to topic files; the story
  stays in the entry.
- **Subjective vs objective divergences are first-class data.** When the
  user's self-report disagrees with the metrics, record both and reconcile
  explicitly — never silently pick one.
- **Three tiers, always.** Prescribed sessions carry underreach / target /
  overreach variants. The overreach tier is gated on readiness AND recovery
  signals above baseline — never a default. The suggested tier is derived at
  view time, never precomputed into data.
- **Workout detail is day-of by default.** Future days carry labels, not
  full prescriptions (configurable in journal/training.md).
- **Respect prescription preference.** journal/training.md says whether
  strength plans carry sets/reps/RPE/weight targets or stay list-only.
- Use the skills: /initiate (once), /journal, /remember, /pull-data, /plan,
  /sync. Their SKILL.md files are the authoritative procedures.
