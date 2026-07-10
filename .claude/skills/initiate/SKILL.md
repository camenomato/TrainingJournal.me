---
name: initiate
description: One-time onboarding wizard — connect fitness data sources via MCP, pull real history, capture the user's actual training routine and goals, and optionally set up the dashboard, password gate, and cloud inbox. Use when the user runs /initiate or asks to set up this repo.
---

# Initiate — onboarding

Run once per person. Ask one question at a time; write as you go so a
partial run still leaves the repo better than it found it.

## 1. Tools interview
Ask which trackers and apps the user actually uses (watch, running app,
gym logger, scale, sleep tracker). Don't assume — "what does your data
actually live in?"

## 2. MCP setup
For each tool, find the connector in docs/sources.md and configure it:
- Claude Code: `claude mcp add …` for community servers, or point the user
  at the official connector (e.g. Strava's) in their client settings.
- Verify EVERY connector with a real test call (e.g. fetch yesterday's
  summary) before moving on. A connector that isn't verified isn't set up.
- If a tool has no MCP route, record the bridge plan (export file, via
  Garmin, etc.) in journal/gear.md rather than pretending.

## 3. History pull → journal/history.md
Seed baselines from real data: resting HR, HRV weekly average, sleep score
average, VO2max/fitness estimate, race history, PRs. Use aggregate/range
endpoints; a year of history is ideal, sparse is fine — never fabricate or
interpolate. Record which source is canonical for what.

## 4. Training interview → journal/training.md
"Give the routine maker your actual workouts":
- Knowledge level (new / experienced / advanced) — calibrates how much
  plans explain vs assume, and progression aggressiveness.
- Current actual split for EVERY workout type they do — running week
  structure and real paces, cycling, swimming, classes.
- Gym/strength deep-dive: preferred split (PPL, upper/lower, full-body…),
  days, fixed anchor lifts, exercises, known working weights.
- Prescription preference: sets/reps/RPE/weight targets in strength plans,
  or exercise-list-only with effort guidance?

## 5. Goals → journal/goals.md
Races with dates and targets, standing goals, constraints. In the user's
words — plans will cite these verbatim.

## 6. Optional setup (offer, don't push)
- Dashboard: fill app/snapshot.ts with the person's real (public-safe)
  data, deploy to Vercel (`vercel deploy --prod --yes` after `vercel link`).
- Password gate: ask for a username + password, derive the hash with
  `node scripts/derive-gate-hash.mjs`, write `{username, salt, params,
  hash}` into the snapshot config. NEVER store or echo the plaintext.
- Cloud inbox: walk through docs/supabase.md.
- Daily sync: offer to install /sync as a scheduled routine.

## Multi-person
Additional people: create journal/people/<slug>/ mirroring the structure
and repeat steps 1-5 for them; their MCP connections are their own.
