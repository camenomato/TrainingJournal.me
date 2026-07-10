---
name: sync
description: The recurring data loop — read recovery signals, drain the cloud inbox, pull fresh daily data, refresh today's workout detail, regenerate the snapshot, redeploy. Use when the user says sync/refresh/update the dashboard, or install as a scheduled daily routine.
---

# Sync — the daily loop

Run manually or as a scheduled routine (offer to install one at a fixed
local time). Each step tolerates the previous day's sync having been
skipped.

## Steps, in order

1. **Read the morning's recovery signals**: HRV, sleep score, readiness
   (and resting HR) from the primary source. These feed the suggested-tier
   inputs for today.
2. **Drain the inbox** (if Supabase is configured): `npm run drain` —
   reads all rows with the local service key, writes each into
   `journal/entries/YYYY-MM.md` keyed by row id (idempotent), deletes the
   drained rows in the same run. See docs/supabase.md.
3. **Pull fresh daily data** and APPEND real trend points (`{date, value}`)
   to the snapshot's trend arrays — dedup by date, never fabricate or
   interpolate, keep ~400 days. A missing day stays missing.
4. **Advance the week**: statuses (done/today/upcoming), preserve any
   self-reported `note` fields (they're user context, not synced data), and
   reflect reality — an unplanned workout on a rest day becomes that
   workout, truthfully labeled.
5. **Generate today's workout detail** from the current plan: three tiers
   (underreach/target/overreach), day-of only by default (training.md may
   change this). Strip leftover detail from past days.
6. **Regenerate the snapshot** (app/snapshot.ts): people array, secret-free,
   nothing from health.md.
7. **Deploy**: `vercel deploy --prod --yes`. Static only — no credentials
   ever go to Vercel.
8. **Report**: what changed, any source failures (say so plainly), any
   inbox entries drained, any duplicates flagged for deletion.
