---
name: plan
description: Build or revise a training plan from the user's real history, stated goals, and current recovery baselines. Every session ships three tiers (underreach/target/overreach). Use when the user asks for a plan, a block, next week's schedule, or a workout.
---

# Plan — the plan builder

Plans that listen: the user's data and goals argue with each other here.
Read BEFORE writing: journal/history.md (baselines), journal/training.md
(actual split, knowledge level, prescription preference), journal/goals.md,
and today's recovery numbers (pull-data skill).

## Rules

1. **Cite the data.** Every plan opens by naming what it assumed: "your HRV
   avg is 46 and your goal is sub-2:00 — this plan assumes both." A plan
   that could have been written without the user's data is a failure.
2. **Three tiers per prescribed session:**
   - **underreach** — "not feeling 100": volume/intensity trimmed, quality
     stripped, still a session worth doing.
   - **target** — the baseline-goal session as designed.
   - **overreach** — "feeling 200": a genuine step up (more volume and/or a
     faster fastest-segment), with an explicit gate in its rationale:
     ONLY when readiness AND recovery signals are above baseline that day.
     Never a default.
   The suggested tier is derived at view time from that day's readiness,
   HRV vs average, and stated feel — never precomputed into data.
3. **Respect the prescription preference** (training.md): strength sessions
   carry sets, reps, RPE, and weight targets calibrated to the user's
   actual split, anchor lifts, and knowledge level — or stay exercise-list
   with effort guidance. Both are first-class.
4. **Respect the actual split.** Build on what the user actually does
   (training.md), not a textbook template. Fixed anchor lifts never rotate
   out. Run days and lift days interleave per their real week.
5. **Paces and loads are ceilings** when recovery signals are below
   baseline. Post-illness: subjective recovery lags objective — plans ease
   back in regardless of the score.
6. **Knowledge level calibrates voice**: new users get the why explained;
   advanced users get numbers without lectures.
7. **Never invent history.** If the data to justify a progression isn't
   there, the progression waits.

## Output

- Dated plan file: `journal/plans/YYYY-MM-DD-<slug>.md` (goal cited, weekly
  structure, sessions with tiers, progression logic, review date).
- Update the dashboard snapshot (app/snapshot.ts): week view + today's
  session detail (three tiers, day-of only by default per training.md).
- Existing plan revisions: new dated file superseding the old, with a line
  on what changed and why (e.g. "reset after illness — weeks 1-2 wiped").
