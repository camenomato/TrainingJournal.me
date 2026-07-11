# Supabase — the drained inbox (optional)

Supabase is a **mailbox, not a database of record**. Steady state is empty.
Skip this entirely if you don't need browser-side journaling; the notebook
falls back to "paste this to your agent".

## Setup

1. Create a free Supabase project.
2. Run this SQL (SQL editor):

```sql
create table inbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  person text not null default 'me',
  kind text not null check (kind in ('journal', 'checkin', 'meal', 'coach-note')),
  payload jsonb not null
);

alter table inbox enable row level security;

-- The browser (anon key) may ONLY insert. No select, no update, no delete.
create policy inbox_insert_only on inbox
  for insert to anon with check (true);

-- Optional: staleness counter the dashboard may call (count only, no content).
create or replace function inbox_pending_count()
returns integer language sql security definer set search_path = public as
  'select count(*)::integer from inbox';
grant execute on function inbox_pending_count() to anon;
```

3. Put the project URL + anon key in the dashboard settings (they are
   public-safe by design: insert-only).
4. Put the project URL + **service role key** in `.env.local` on your
   machine only (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) — the drain uses
   it. `.env.local` is gitignored; the service key must never be committed
   or deployed.

## The drain contract

`/sync` (or `npm run drain`) does, in one run:

1. Read all inbox rows with the service key.
2. Write each into `journal/entries/YYYY-MM.md`, keyed by row `id` —
   **idempotent**: a row id already present in the journal is skipped, so a
   crash mid-drain can never duplicate an entry.
3. Delete the drained rows.

Anything sitting in the inbox for more than a day means your sync didn't
run; the dashboard can show "N entries waiting" via `inbox_pending_count`.

## Together / shared mode

The **Together** tab shows several people side by side. There is no shared
database of private metrics — the same inbox is the only shared surface, and
it is **insert-only**. You never read another person's private tables; you
see exactly what each person *chose to post*. Sharing is opt-in by
construction: private data (health.md, raw readings) never enters the inbox.

Configure it manually — it's a preference, not a wizard. Two topologies:

**1. One agent, many sources (household / coach).** A single machine holds
several people's clones (or one clone with a `person` per athlete) and one
Claude has MCP access to each person's trackers. It pulls everyone's data
locally and bakes all of them into the one deployed snapshot. The Together
cards read straight from that local snapshot — nothing crosses the network
except the finished, secret-free bundle. This is what the example ships.

**2. Many people, one inbox.** Each person runs their own clone and points
their notebook at the **same** Supabase project (same URL + anon key). The
`person` field tags who a row is for; the drain already routes each row to
the right person's `journal/entries/`. Anyone can post a check-in, a
`coach-note`, or a kudos to anyone else — insert-only, so posting is the
whole permission model. Whoever runs `/sync` drains the shared inbox and
regenerates the snapshot. Each person still decides what of their own data
becomes a Together card by what they publish into their snapshot; the inbox
only carries what was deliberately typed and sent.

Either way the invariant holds: **the inbox is a one-way mailbox, never a
readable store of anyone's private metrics.** If you later want true
cross-reading (shared per-person snapshots behind the gate), that is the
Tier-2 upgrade in [privacy.md](privacy.md) — a deliberate step, not the
default.
