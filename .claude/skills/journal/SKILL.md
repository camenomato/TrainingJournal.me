---
name: journal
description: Add a dated entry to the training journal in journal/entries/. Use when the user narrates something worth remembering — how a session felt, an illness, a decision, a milestone — or says "journal this" / "log this".
---

# Journal — dated entries

Entries are the narrative record: what happened and how it felt,
date-stamped, newest first. Topic files hold conclusions; entries hold the
story that led to them.

## Storage

- One file per month: `journal/entries/YYYY-MM.md` (create with a
  `# Journal — <Month> <Year>` heading on first entry).
- Entries under `## YYYY-MM-DD` headings, newest first. Multi-person:
  the person's own `journal/people/<slug>/entries/`.
- Entries drained from the cloud inbox carry their row id as an HTML
  comment (`<!-- inbox:UUID -->`) — that's the idempotency key; never
  remove it.

## What an entry contains

1. **What happened** — the event, in the user's terms.
2. **How it felt** — the subjective read; capture it faithfully, doubts
   included. This is the part no tracker records.
3. **What the data said** — pull the numbers if relevant (pull-data skill)
   and note agreement or disagreement with the subjective read. When they
   disagree, record both sides explicitly — divergences are the most
   valuable entries.
4. **Decision / lesson** — if one was made.

## After writing

- Promote durable conclusions to topic files (remember skill); the story
  stays in the entry.
- Append-only: corrections are a new dated entry referencing the old one.
