---
name: pull-data
description: Pull fresh data from the connected fitness MCP sources — activities, readiness, HRV, sleep, resting HR — reconcile discrepancies between sources, and file anything durable. Use when the user asks to pull/check/compare their data or mentions a workout to verify.
---

# Pull data — retrieve from sources

## Steps

1. **Check what's connected.** The sources configured by /initiate are
   listed in journal/gear.md. If one is unavailable, say so — never
   silently skip.
2. **Pull what the question needs, not everything.** Prefer
   aggregate/range endpoints over raw intraday ones (intraday sleep/HRV
   payloads are enormous). Activities: query the same window in each
   connected source when comparing.
3. **Reconcile before reporting** (full rules in docs/sources.md):
   - Synced copies are identical; parallel phone recordings read several %
     short — the device/watch copy is canonical, flag duplicates.
   - Treadmill/accelerometer mode loses to GPS outdoors.
   - Derived stats (moving time, max speed) legitimately differ across
     services; distance is the comparable number.
4. **Compare against baselines** in journal/history.md and say explicitly
   when something is off baseline — that's usually the point of the pull.
5. **File what's durable** (remember skill), offer a journal entry for
   notable sessions, and leave volatile dailies to the sync's trend data.

## Rules

- Real data only — never estimate a number a tool didn't return; report
  gaps as gaps.
- When objective data and the user's self-report disagree, present both
  and reconcile explicitly — post-illness especially, feel beats score.
