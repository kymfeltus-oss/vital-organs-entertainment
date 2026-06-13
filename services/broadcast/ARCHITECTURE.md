# PARABLE Broadcast Console v1.0 — Architecture (FROZEN)

**Status:** APPROVED & LOCKED. Do not refactor away these boundaries.

**Architecture Version:** 1.0 (Mapped to `services/broadcast/config.ts`)

**Protected Path:** `/dashboard/broadcast` (Requires active email gate validation)

---

## 1. Core Layer Responsibilities

- **UI Presentation:** `components/broadcast/*` and `hooks/useProductionStore.ts`. Purely reactive views. Never owns or alters broadcast truth.
- **ProductionStore:** `lib/broadcast/types.ts`. Synchronized immutable state snapshot hydrated via server sync.
- **ProductionBrain:** `services/broadcast/ProductionBrain.ts`. The central nervous system organizing the processing pipeline loop.
- **Core Telemetry Services:** `BroadcastSourceService`, `AudioHealthService`, `StreamHealthService`, `ReadinessEngine`, `ProductionLogService`. Holds baseline state and diagnostic data.
- **Adapters Layer:** `services/broadcast/adapters/*`. Translates and normalizes hardware signatures to standard PARABLE contracts.
- **Command API:** `POST /api/broadcast/command`. The single gate for incoming dashboard actions.
- **ReadinessEngine:** `services/broadcast/ReadinessEngine.ts`. The deterministic system launch gatekeeper.
- **ProductionSafetyEngine:** `services/broadcast/ProductionSafetyEngine.ts`. Telemetry monitor generating active mitigation recommendations.

---

## 2. The Operational Pipeline

Every hydration cycle executes strictly in this sequence:

1. **Observe:** Ingest raw metrics from underlying physical adapters (vMix HTTP XML data paths).
2. **Evaluate:** Run telemetry metrics through the `ReadinessEngine` to classify failures.
3. **Interlock:** Check and enforce launch boundaries and handle supervisor overrides.
4. **Mitigate:** Route active warnings to the `ProductionSafetyEngine` for recommendation rendering.
5. **Log:** Append the unified data block to the `ProductionLogService` ring-buffer trail.

---

## 3. Strict Execution Constraints

- **Immutable UI Data:** No client-side mock values or hard-coded camera layouts are permitted. Standard production mode renders an empty registry until a valid adapter handshake updates the data tree.
- **Unified Action Path:** UI Actions → `POST /api/broadcast/command` → `ProductionBrain.executeCommand()` → Adapters → State Sync. Supported parameters are restricted to: `set_preview`, `transition`, `go_live`, and `stop_live`.
- **410 Outdated Paths:** Legacy routes like `/api/broadcast/vmix` must explicitly respond with a **410 Gone** status code.
- **The Interlock Gate:** All launch evaluation uses `ReadinessEngine.canLaunchWithOverride()`. Overrides require a reason string of **≥ 8 characters** and do not hide failures from the view logs. **BLACK** hard blocks completely lockout system deployment.
- **Anti-Marketing Language Guard:** The framework rejects superficial buzzwords. It must remain titled the **Production Safety Engine** and cannot be renamed to "AI Co-Pilot", "AI Auto-Fix", or "AI Auto-Correct".

---

## 4. Verification

```bash
npm run test:broadcast   # 10 tests must pass
```

Header data mode labels (exact): `Live adapter data` | `Simulated telemetry` | `Unavailable`

---

## 5. Forbidden (regression)

- UI-local fake broadcast state or hard-coded camera cards
- Bypassing `canLaunchWithOverride()` for go-live
- Real API calls outside `services/broadcast/adapters/`
- Changing `ProductionStore` shape without an architecture version bump
