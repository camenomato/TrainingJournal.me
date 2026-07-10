# Privacy model

The design goal: your identity and history exist **only in your private
clone** on your machine. Everything else receives strictly less.

## The three trust zones

1. **Fitness services (cloud)** — your existing accounts (Garmin, Strava…),
   reached only through MCP servers configured locally with your keys.
2. **Your machine** — the clone: `journal/` markdown, the agent, MCP
   servers, and the build step that produces a snapshot.
3. **Public web** — a static dashboard (Vercel) with **zero credentials**,
   and optionally a Supabase inbox.

## What each party can see

| Party | Sees |
|---|---|
| Vercel | A static bundle containing the dashboard snapshot: trend points, plan labels, whatever you chose to publish. No keys, no raw journal, no health.md. |
| Supabase (optional) | An insert-only `inbox` table drained to zero on every sync. In Tier-2 shared mode only: per-person snapshots equivalent to the static bundle. |
| Anyone with the URL | The password gate (if enabled). Behind it, the snapshot. |
| MCP vendors | Whatever their own APIs already see — nothing new. |

## The password gate, honestly

The gate stores a salted PBKDF2 hash in the public config and compares in
the browser. The plaintext password is never stored anywhere. This deters
visitors, crawlers, and shoulder-surfers — but the snapshot still ships in
the JS bundle, so it is a **privacy curtain, not encryption**. If your
snapshot carries more than you'd put on a postcard, use the v2 upgrade
path: encrypt the snapshot with a key derived from the same password.

## Rules baked into the skills

- health.md and anything marked private never enters the snapshot.
- The drain deletes inbox rows in the same run that stores them locally.
- Snapshot generation is explicit: the sync shows what's included.
