---
name: remember
description: Store a durable personal fact in the right journal topic file. Use when the user shares something worth keeping past this conversation — gear, a PR, a preference, a routine change — or says "remember this".
---

# Remember — file a fact

## Steps

1. **Identify the fact.** Strip it to what's durable. Daily metrics (today's
   HRV, steps) are NOT facts for topic files — they belong in trend data or
   a journal entry.
2. **Find the topic file:** profile, history, training, goals, gear, health
   (see the journal/ directory). New topic → new `journal/<topic>.md`.
3. **Update in place.** Replace stale values — one fact, one place. Date
   time-sensitive facts `(YYYY-MM)`. Old values that still matter (a
   previous PR, discontinued medication) move to a history section, not
   deleted.
4. **Fill `(fill in)` placeholders** when the fact answers one.
5. **Cross-reference, don't copy** — one file owns a fact; others link.

## Rules

- Facts only — never embellish, infer, or round off what the user said.
- Ambiguous fact → ask. A wrong "fact" is worse than a placeholder.
- health.md content is private by contract: it never enters the dashboard
  snapshot or anything that deploys.
