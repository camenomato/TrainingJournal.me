---
name: meal
description: Log meals, estimate the day's calories, and read the energy balance against training. Use when the user mentions eating, logs a meal, asks about calories/fueling, or says things like "cheat meal", "big lunch", "skipped dinner".
---

# Meal — fuel tracking and energy balance

Nutrition is a training signal here, not a guilt ledger. The point is the
relationship between fuel and performance — in both directions.

## Logging a meal

1. **Resolve against journal/meals.md first.** "2 rotis + dal" should match
   the library and log in one line. Offer to add unrecognized repeat meals
   to the library so next time is one line too.
2. **Estimate honestly.** Unlisted meals get a RANGE (e.g. "biryani, eating
   out: ~700-900 kcal"), never fake precision. Use the midpoint for totals,
   keep the range in the log. If a photo or menu is available, use it.
3. **Write to the journal**: meal entries go in the day's journal entry
   (entries/YYYY-MM.md) as a `Fuel:` line — meal, kcal (or range), protein
   if known. Browser-side logging arrives via the inbox with kind "meal"
   (drained like everything else) — including one-tap **quick meals**.

## Quick meals (dashboard one-tap logging)

Keep a short favourites list in journal/meals.md under "Quick meals" (~4-6
repeat meals). `/sync` copies it into the snapshot (`quickMeals`), and the
Fuel tab renders each as a one-tap button that inserts a `kind:"meal"` inbox
row (or copies the line when no inbox is configured). This is just the
low-friction path into the same meal-logging flow above — resolve, estimate,
and reconcile the drained entries exactly as with any other meal.

**Custom meals saved from the browser.** The Fuel tab also lets the user add
their own meal (name, portion, kcal, protein). It is cached in that browser's
localStorage so it's reusable immediately, and logged like any meal — but the
inbox payload carries `save: true` and a structured `meal` object. On drain,
when you see `save: true`: add that meal to the journal/meals.md **Library**
(and to the **Quick meals** shortlist if it's a genuine repeat), so the next
snapshot serves it from the source of truth and the browser cache is no longer
needed. Treat the user's entered numbers as their own estimate; don't override
them, but flag anything implausible.

## The day's picture

When asked (or at sync), compute:
- **In:** sum of the day's logged meals (state coverage honestly — "3 meals
  logged, dinner missing" ≠ a real total).
- **Out:** tracker active calories + estimated BMR (from profile
  height/weight/age; calibrate the estimate against the real weight trend
  over weeks, don't trust formulas blindly) + steps as a sanity check on
  non-exercise movement. Tracker calorie estimates are rough — say so.
- **Balance:** in − out, against the target in journal/meals.md.

## Fuel-aware training rules (feed these to /plan and /sync)

- **Surplus is fuel, not failure:** a cheat meal / big day today means
  glycogen tomorrow — flag tomorrow as a good day for the harder session
  (it can nudge the suggested tier toward overreach IF recovery signals
  agree; fuel alone never overrides readiness).
- **Deficit + hard training don't mix silently:** planned quality sessions
  on multi-day deficits get a fueling note (pre-session carbs, or move the
  session).
- **Protein floor** matters more than the calorie number on a cut —
  flag days under it.

## The deficit-performance correlation (actively hunted)

Fuel effects are LAGGED — a deficit shows up in performance days later.
The sync maintains `journal/analysis/fuel-performance.md`:

1. Each sync appends the day's energy balance next to that day's
   performance markers (pace-at-HR, session RPE vs prescribed, readiness,
   subjective feel from entries).
2. Periodically test lags of 1-5 days: do below-baseline sessions cluster
   N days after deficit streaks? Same for surpluses and strong sessions.
3. When a pattern recurs (≥3 instances), surface it as a NAMED HYPOTHESIS
   with its evidence: "3 of your last 4 below-baseline runs came 2 days
   after a ≥500 kcal deficit day — watching this." Then keep testing it.
4. Be statistically honest: small n, confounders everywhere (sleep, stress,
   illness). These are hypotheses to watch and plan around, never claimed
   causation. An established pattern feeds /plan (e.g. "no quality sessions
   2 days after big deficits").
