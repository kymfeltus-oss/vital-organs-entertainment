# Today's Service — Performance Audit

**Route:** `/dashboard/todays-service`  
**Initial audit:** 2026-06-24  
**Final verification:** 2026-06-25

---

## Final results (acceptance)

| Metric | Target | Measured | Status |
|--------|--------|----------|--------|
| **LCP** | &lt; 2.5 s | **1,921 ms** | Pass |
| **CLS** | ≈ 0 | ~0 (reserved skeleton min-heights) | Pass |
| **TTFB** (document) | — | **~750 ms** (authenticated) | Acceptable; see breakdown |
| **Duplicate `GET /api/v1/todays-service` on mount** | None | None when SSR `initialData` present | Pass |
| **Production build** | Clean | `npm run build` exit 0 | Pass |

### Test environment

| Item | Value |
|------|--------|
| Mode | **Production** (`npm run build` + `npm start`) |
| Browser | Chrome **Incognito**, extensions disabled |
| Network | Local dev / LAN (not throttled unless noted) |
| Auth | Logged-in ops admin (team gate) |
| Extensions | **Excluded** from conclusions — Incognito only |

> Unauthenticated `curl` to `/dashboard/todays-service` returns **307** in ~130 ms (redirect to team gate). That is not representative of signed-in LCP/TTFB.

---

## Executive summary (original issue)

The **~19 s LCP** was caused by the server **blocking the entire HTML response** on `loadTodaysService()` before the `<h1>` could paint. That function performed:

1. 12+ Supabase queries (parallel, but still hundreds of ms)
2. **`syncAlertsFromReadiness`** — extra `listAlerts` + sequential `createAlert` writes on every page view
3. **`setLiveReadinessState`** — Redis `connect()` with no timeout (hangs ~15–20 s when `REDIS_URL` is set but unreachable)

Lighthouse attributed LCP to the service name `<h1>` because it is the largest text — but it was not sent until the slow server function completed.

**After fix:** LCP **1,921 ms** — shell + `<h1>` stream immediately; dashboard body loads inside `<Suspense>`.

---

## Architecture verification (2026-06-25)

### 1. Streaming & LCP element

```text
page.tsx (RSC)
├── TodaysServiceShell (server)
│   ├── ServiceHeaderTitle → <h1>  ← LCP candidate (first HTML chunk)
│   ├── HeaderActionsSkeleton
│   └── <Suspense fallback={DashboardSkeleton}>
│       └── TodaysServiceDashboardLoader → loadTodaysService(purpose: "display")
│           └── TodaysServiceClient(initialData)  ← no mount refetch
```

- `<h1>` is **outside** `<Suspense>` — included in the first streamed shell.
- Non-critical body is **behind Suspense** — does not block the title.

**Files:** `app/dashboard/todays-service/page.tsx`, `components/todays-service/ServiceHeaderTitle.tsx`

### 2. No duplicate initial API fetch

- `TodaysServiceDashboardLoader` passes `initialData` from `getTodaysServiceForPage()`.
- `useTodaysService({ initialData })` sets `skipInitialFetch = true` — **no** `GET /api/v1/todays-service` on mount.
- `reload()` runs only after explicit user actions (Begin Service, Refresh, mutations).

**Files:** `lib/todays-service/useTodaysService.ts`, `components/todays-service/TodaysServiceDashboardLoader.tsx`

### 3. SSE deferred until after first paint

- `scheduleAfterFirstPaint`: double `requestAnimationFrame` → `requestIdleCallback` (3 s timeout) or 1.5 s fallback.
- SSE opens only after `data` is hydrated from SSR — does not compete with LCP paint.

**File:** `lib/todays-service/useTodaysService.ts`

### 4. Fonts / CSS vs `<h1>`

- Root `next/font` (Bebas Neue for `.font-headline`): `display: "swap"`, `adjustFontFallback: true`, Arial Narrow fallback.
- LCP `<h1>` uses `font-headline` — text renders immediately with fallback; swap does not block paint.
- Production layout CSS: `ParableProductionRoot` loads JetBrains Mono with `display: "swap"` (sidebar/mono only — not LCP).

**Files:** `app/layout.tsx`, `components/parable/ParableProductionRoot.tsx`

### 5. Code splitting, streaming CLS & LCP

- All dashboard sections: `next/dynamic` + stable min-height placeholders.
- **Streaming section:** `StreamingSectionFallback` (title + reserved card grid) while chunk loads — LCP `<h1>` is server-rendered in `ServiceHeaderTitle` above this section.
- **StreamingSetupWizard:** lazy `BroadcastDestinationChooser`, `SoundDeviceMeter`; `WIZARD_BODY_MIN_HEIGHT` + `StreamingSetupWarningSlot` reserve space for warnings/errors.
- **Destination cards:** `React.memo`, fixed min-heights for test result / error / action rows (`lib/streaming/streaming-layout.ts`).
- Wizards/modals: `dynamic(..., { ssr: false })` — mount only when opened.
- `QuickActions`: `ssr: false` — not on critical path.
- **No fetch/subscribe during render** — OAuth resume + Supabase/SSE deferred to `useEffect` / `scheduleAfterFirstPaint`.
- **Lighthouse:** test in Chrome Incognito with extensions disabled (Adobe Acrobat `sidePanelUtil.js` inflates main-thread cost).

**Files:** `components/todays-service/TodaysServiceClient.tsx`, `components/todays-service/StreamingSection.tsx`, `components/streaming/StreamingSetupWizard.tsx`, `lib/streaming/streaming-layout.ts`, `scripts/perf-production-check.mjs` (`npm run perf:production`)

### 6. Proxy / middleware & TTFB (~750 ms)

`/dashboard/todays-service` is **not** in `TEAM_PROTECTED_PREFIXES` (`/ops`, `/dashboard/broadcast` only). Proxy returns `NextResponse.next()` **without** a Supabase round-trip.

**TTFB budget (authenticated document):**

| Stage | Est. | Notes |
|-------|------|--------|
| `requireCrewModuleAccess` → `requireOpsAdminUser` | 200–400 ms | `supabase.auth.getUser()` (+ optional `refreshSession`) |
| `readOpsCrewRoleCookie` | &lt; 20 ms | After auth |
| `getOrCreateTodayService` (parallel with auth) | 100–250 ms | Single row upsert/select |
| RSC shell render + first stream chunk | 50–150 ms | Shell + `<h1>` |
| Network / TLS (local) | 50–100 ms | |
| **Total** | **~500–900 ms** | Aligns with **~750 ms** observed |

**Not on critical path for first byte:** `loadTodaysService()` (12+ queries) runs inside Suspense **after** shell streams.

**Files:** `proxy.ts`, `lib/ops/require-crew-module-access.ts`, `lib/todays-service/get-todays-service-cached.ts`

### 7. Display vs mutation loads

| Purpose | Alert sync | Redis `set` | Use |
|---------|------------|-------------|-----|
| `display` | Skipped | Async (`scheduleLiveReadinessState`) | Page Suspense load |
| `mutation` | Full | Awaited | POST/PATCH APIs, Begin Service |

**File:** `lib/todays-service/service.ts` (`refreshReadiness`)

---

## Request budget (production)

| Request | When | Duplicate? |
|---------|------|------------|
| Document HTML (streamed shell + Suspense body) | Navigation | No |
| JS chunks (dynamic sections) | After interactive | No |
| `GET /api/v1/todays-service` | **Only** explicit `reload()` / post-mutation | **No** on mount |
| `GET /api/v1/todays-service/live` (SSE) | After first paint + idle | No (patches SSR state) |

---

## Top 10 bottlenecks (before → after)

| # | Bottleneck | File | Est. impact | Fix |
|---|------------|------|-------------|-----|
| 1 | Full `loadTodaysService()` blocks page TTFB | `page.tsx` | **+15–19 s LCP** | Streaming: fast `getOrCreateTodayService` + Suspense |
| 2 | Redis connect hang | `redis-store.ts` | **+15–20 s** | 2 s timeout, fail-fast to memory |
| 3 | Alert sync on read path | `service.ts` | **+200–800 ms** | Skipped on `purpose: "display"` |
| 4 | Awaited Redis SET on display | `refreshReadiness` | **+0–20 s** | Fire-and-forget on display |
| 5 | Full client bundle on critical path | `TodaysServiceClient.tsx` | **+1–3 s TTI** | Dynamic imports for sections |
| 6 | Duplicate client GET after hydration | `useTodaysService.ts` | **+300–600 ms** | `initialData` skips mount fetch |
| 7 | SSE at mount | `useTodaysService.ts` | **+100–300 ms** | Deferred until rAF × 2 + idle |
| 8 | Large RSC payload blocks shell | `TodaysServiceClient` | **+200–500 ms** | Suspense streams body after LCP |
| 9 | `refreshReadiness` re-lists alerts | `syncAlertsFromReadiness` | **+50–150 ms** | Skipped on display |
| 10 | Auth + data sequential | `page.tsx` | **+100–300 ms** | `Promise.all` auth + `getOrCreateTodayService` |

---

## Remaining non-critical bottlenecks

These do **not** block LCP (&lt; 2.5 s) but are the next targets if TTFB or TTI need improvement:

1. **Supabase auth on every navigation** (~200–400 ms) — `requireOpsAdminUser` in RSC; no edge session cache.
2. **Suspense body payload** — 12 parallel list queries (~400–800 ms) before dashboard interactive; acceptable behind skeleton.
3. **First SSE connect** — server runs full `loadTodaysService` on first stream message; client already has SSR data (patch only, no extra GET).
4. **JetBrains Mono** in `ParableProductionRoot` — small extra font download for production chrome (not LCP).
5. **Remote Supabase latency** — `getOrCreateTodayService` + 12 lists bound by DB RTT; consider read replicas or edge caching for read-only display loads.

---

## Production workflow confirmation

| Workflow | Status | Notes |
|----------|--------|-------|
| Begin Service | Works | `beginService()` → API → `reload()` (intentional refetch) |
| Setup wizards (Sound, Camera, Internet) | Works | Lazy `dynamic({ ssr: false })` |
| Live updates (SSE) | Works | Deferred connect; heartbeat 30 s; patch-only client |
| Edit service / profile | Works | PATCH → `setData` from response |
| Readiness refresh | Works | Explicit user action only |
| Sound device save | Works | POST `/api/v1/sound` → `onSaved()` → `reload()` |

---

## How to re-test

```bash
npm run build
npm start
```

1. Chrome Incognito, extensions off, logged in as ops admin.
2. Navigate to `/dashboard/todays-service`.
3. DevTools → Performance: confirm LCP element is service name `<h1>`, LCP &lt; 2.5 s.
4. Network: confirm **no** `GET /api/v1/todays-service` until Refresh / Begin Service / mutation.
5. Network: confirm SSE `/api/v1/todays-service/live` starts **after** first paint (idle).
6. Verify Begin Service, Sound wizard, and live status indicator after dashboard loads.

---

## Guardrails

See `lib/todays-service/PERFORMANCE.md`.
