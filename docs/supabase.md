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
  kind text not null check (kind in ('journal', 'checkin', 'coach-note')),
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
