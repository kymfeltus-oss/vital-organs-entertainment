# Today's Service — performance guardrails

Production operator dashboard (`/dashboard/todays-service`).

## Data loading

- **Initial load:** server-side `getOrCreateTodayService()` streams the LCP `<h1>` immediately; full payload loads inside `<Suspense>` via `getTodaysServiceForPage()` (`purpose: "display"`).
- **Display loads** skip alert sync and block on Redis — readiness is computed in memory; cache write is async.
- **After mutations:** full reload with `purpose: "mutation"` (alert sync + awaited redis).
- **Never** duplicate `GET /api/v1/todays-service` after hydration when SSR data is present.

## Live updates (SSE)

- SSE connects **after first paint** (double `requestAnimationFrame` + `requestIdleCallback`, 3s timeout).
- **First SSE message:** full cached payload (readiness, alerts, cameras, destinations) — patches client state only.
- **Heartbeat (30s):** readiness + service start time only — no DB query, no camera/destination arrays.
- **Targeted reload:** camera or streaming pub/sub events trigger a single full payload refresh on the server stream, not a client refetch loop.
- Client applies **patch-only** updates; unchanged heartbeats do not trigger React state updates.

## Server vs client split

- **Server:** `TodaysServiceShell`, `ServiceHeaderTitle` (LCP `<h1>`), initial data fetch.
- **Client islands:** header actions, live status, interactive sections, wizards/modals.
- **Below-fold sections** are code-split with `next/dynamic` and reserved placeholder heights (CLS guard).

## Client bundle

- Setup wizards and edit modals are **lazy loaded** with `next/dynamic` (`ssr: false`) and mount only when opened.
- Lucide icons are imported **per icon**, never entire libraries.
- Heavy sections use `React.memo` to avoid rerendering when unrelated live fields change.

## UI stability

- Shell + skeleton render immediately; sections reserve min-height to prevent layout shift.
- Camera preview streams start only when the user opens preview — never on page load.

## Forbidden patterns

- No `setInterval` client refetch of `/api/v1/todays-service`.
- No full `loadTodaysService()` on heartbeat in `app/api/v1/todays-service/live/route.ts`.
- No placeholder polling loops for static equipment lists.
- No synchronous debug file logging in hot paths (`loadTodaysService`, repository writes).
- No SSE connection before idle/interactive — heartbeats must not block first paint.
