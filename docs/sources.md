# Source connectors

The living version of the landscape survey (last verified 2026-07). The
ecosystem moves monthly — PRs updating this table are the most welcome kind.

## Official MCP connectors (plug-and-play)

| Tool | Notes |
|---|---|
| Strava | Official MCP connector (Jun 2026) — subscriber-only, read-only, revocable. Activity history, fitness trends, readiness, gear. |
| Runalyze | MCP over its aggregation of Garmin, Polar, Suunto, COROS, Whoop, Oura + its health layer. |

## Community MCP servers over official APIs

| Tool | Server | Notes |
|---|---|---|
| Garmin | `garmin_mcp` (Taxuspt) and others | ~96 tools; the richest single source. Prefer aggregate/range endpoints — intraday sleep/HRV payloads are enormous. |
| Whoop | `whoop-mcp` | Cycles, recovery, strain, workouts. Strength Trainer data is NOT exposed by Whoop's API. |
| Oura | `oura-mcp` | Sleep, readiness, resilience over API v2 token. |
| Fitbit / Google Health | `fitbitmcp`, `google-health-mcp` | Fitbit Web API is migrating to Google Health API v4 through 2026 — OAuth/scopes/endpoints in flux. |
| Hevy | `hevy-mcp` (TS or Rust) | Full workout/routine/exercise CRUD — strongest strength-logging source. Requires Hevy PRO API key. |
| Intervals.icu | community MCP | Strong training-analysis layer. |

## Aggregators (one connection, many sources)

| Tool | Notes |
|---|---|
| athletedata.health | Hosted MCP, 20+ sources. Convenient, but hosted — your data flows through a third party, which cuts against local-first. Understand the trade-off before choosing it. |
| Open Wearables | Open-source multi-platform server. |

## API-only / export-only (bridgeable)

| Tool | Route |
|---|---|
| Apple Health | No cloud API — on-device HealthKit. Bridges: Health Auto Export-style apps, third-party MCP bridges, or import into Google Health and read there. |
| Polar / Suunto / COROS | Official APIs; easiest path is via Runalyze or an aggregator. |
| Withings | Official API; in aggregators. Body composition / weight. |
| TrainingPeaks | Partner API (approval required). |
| Samsung Health | Health Connect on Android; export tools. |
| Runna | No public API — but its plans sync into Garmin as named structured workouts (`W<N> <Day> …`), which `/plan` reads. Proven pattern. |
| Strong / Peloton / MyFitnessPal | CSV export / unofficial API / restricted partner API — file-import recipes at best. |

## Reconciliation rules (learned from real data)

- A service that syncs from your device produces **identical distance** —
  Strava-from-Garmin matches the watch exactly.
- **Parallel recordings differ**: a phone app recording alongside a watch
  reads several % short (phone GPS). The device/watch copy is canonical;
  flag duplicates for deletion.
- **Treadmill/accelerometer mode disagrees with GPS**; GPS wins outdoors.
- Derived stats (moving time, max speed) differ across services even on the
  same file — different smoothing. Distance is the comparable number.
