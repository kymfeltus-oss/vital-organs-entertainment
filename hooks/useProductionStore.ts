"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BROADCAST_SNAPSHOT_POLL_MS } from "@/lib/broadcast/config";
import {
  dataSourceLabel,
  mergeProductionStore,
  type ProductionUiOverrides,
} from "@/lib/broadcast/productionStore";
import type { ProductionStore, TransitionType } from "@/lib/broadcast/types";
import { useBroadcastHealth } from "@/lib/parable/BroadcastHealthContext";
import {
  loadLastKnownSnapshot,
  saveLastKnownSnapshot,
} from "@/lib/parable/last-known-good";
import { parableFetch } from "@/lib/parable/resilient-fetch";

async function fetchSnapshot(
  uiOverrides: ProductionUiOverrides,
  mitigationCheckId?: string,
): Promise<{ store: ProductionStore; latencyMs: number }> {
  const params = new URLSearchParams();
  if (uiOverrides.supervisorOverride) params.set("supervisorOverride", "true");
  if (uiOverrides.supervisorReason) {
    params.set("supervisorReason", uiOverrides.supervisorReason);
  }
  if (uiOverrides.rehearsalMode) params.set("rehearsalMode", "true");
  if (mitigationCheckId) params.set("mitigationCheckId", mitigationCheckId);

  const query = params.toString();
  const { response, latencyMs } = await parableFetch(
    `/api/broadcast/snapshot${query ? `?${query}` : ""}`,
    { cache: "no-store" },
    { timeoutMs: 12_000, subsystem: "snapshot" },
  );

  if (!response.ok) {
    throw new Error("Unable to load production snapshot.");
  }

  const store = (await response.json()) as ProductionStore;
  return { store, latencyMs };
}

async function postCommand(
  body: Record<string, unknown>,
): Promise<ProductionStore> {
  const { response } = await parableFetch(
    "/api/broadcast/command",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { timeoutMs: 15_000, subsystem: "command" },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Production command failed.");
  }

  const payload = (await response.json()) as { store: ProductionStore };
  return payload.store;
}

export function useProductionStore() {
  const {
    shouldFreezePolling,
    reportSnapshotSuccess,
    reportSnapshotFailure,
    resolveSnapshotPollInterval,
    guardCommand,
    recordCommandOutcome,
    snapshotPollIntervalMs,
    pollingFrozen,
  } = useBroadcastHealth();
  const [store, setStore] = useState<ProductionStore | null>(() => loadLastKnownSnapshot());
  const [loading, setLoading] = useState(!store);
  const [error, setError] = useState<string | null>(null);
  const uiOverridesRef = useRef<ProductionUiOverrides>({});

  const applyStore = useCallback((next: ProductionStore) => {
    setStore(mergeProductionStore(next, uiOverridesRef.current));
  }, []);

  const refresh = useCallback(async () => {
    if (shouldFreezePolling()) {
      const cached = loadLastKnownSnapshot();
      if (cached) {
        applyStore(cached);
        setError(null);
      }
      setLoading(false);
      return;
    }

    try {
      const { store: next, latencyMs } = await fetchSnapshot(uiOverridesRef.current);
      saveLastKnownSnapshot(next);
      applyStore(next);
      reportSnapshotSuccess(next, latencyMs);
      setError(null);
    } catch (err) {
      reportSnapshotFailure(err);
      const cached = loadLastKnownSnapshot();
      if (cached) {
        applyStore(cached);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Snapshot refresh failed.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    applyStore,
    reportSnapshotFailure,
    reportSnapshotSuccess,
    shouldFreezePolling,
  ]);

  useEffect(() => {
    void refresh();

    if (shouldFreezePolling()) {
      return;
    }

    const intervalMs = resolveSnapshotPollInterval() || BROADCAST_SNAPSHOT_POLL_MS;
    const intervalId = window.setInterval(() => {
      void refresh();
    }, intervalMs);
    return () => window.clearInterval(intervalId);
  }, [refresh, resolveSnapshotPollInterval, shouldFreezePolling, snapshotPollIntervalMs, pollingFrozen]);

  const runGuardedCommand = useCallback(
    async (
      action: string,
      body: Record<string, unknown>,
      confirmed = false,
    ): Promise<ProductionStore> => {
      const guard = guardCommand(action, body, confirmed);
      if (!guard.allowed) {
        recordCommandOutcome(action, "blocked", guard.reason);
        throw new Error(guard.reason ?? "Command blocked by PARABLE guardrails.");
      }

      try {
        const updated = await postCommand(body);
        recordCommandOutcome(action, "success");
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Command failed.";
        recordCommandOutcome(action, "error", message);
        throw err;
      }
    },
    [guardCommand, recordCommandOutcome],
  );

  const setUiOverrides = useCallback((overrides: ProductionUiOverrides) => {
    uiOverridesRef.current = { ...uiOverridesRef.current, ...overrides };
    setStore((current) =>
      current ? mergeProductionStore(current, uiOverridesRef.current) : current,
    );
  }, []);

  const selectPreview = useCallback(
    async (sourceId: string, confirmed = false) => {
      const updated = await runGuardedCommand(
        "set_preview",
        {
          action: "set_preview",
          sourceId,
          ...uiOverridesRef.current,
        },
        confirmed,
      );
      applyStore(updated);
      return { ok: true as const, message: "Loaded into Preview" };
    },
    [applyStore, runGuardedCommand],
  );

  const runTransition = useCallback(
    async (transition: TransitionType, confirmed = false) => {
      const updated = await runGuardedCommand(
        "transition",
        {
          action: "transition",
          transition,
          ...uiOverridesRef.current,
        },
        confirmed,
      );
      applyStore(updated);

      const labels: Record<TransitionType, string> = {
        cut: "Cut to Preview",
        take: "Take — Preview to Program",
        fade: "Fade to Program",
        stinger: "Stinger fired",
      };
      return { ok: true as const, message: labels[transition] };
    },
    [applyStore, runGuardedCommand],
  );

  const goLive = useCallback(
    async (confirmed = false) => {
      const guard = guardCommand(
        "go_live",
        { action: "go_live", ...uiOverridesRef.current },
        confirmed,
      );
      if (!guard.allowed) {
        recordCommandOutcome("go_live", "blocked", guard.reason);
        throw new Error(guard.reason ?? "Go live blocked.");
      }

      const { response } = await parableFetch(
        "/api/broadcast/command",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "go_live",
            ...uiOverridesRef.current,
          }),
        },
        { timeoutMs: 20_000, subsystem: "command" },
      );

      const payload = (await response.json()) as {
        store?: ProductionStore;
        error?: string;
      };

      if (!response.ok) {
        if (payload.store) {
          applyStore(payload.store);
        }
        recordCommandOutcome(
          "go_live",
          "error",
          payload.error ?? "Go live blocked by readiness interlock.",
        );
        throw new Error(payload.error ?? "Go live blocked by readiness interlock.");
      }

      if (!payload.store) {
        recordCommandOutcome("go_live", "error", "Missing production store.");
        throw new Error("Go live response missing production store.");
      }

      applyStore(payload.store);
      recordCommandOutcome("go_live", "success");
      return {
        ok: true as const,
        message: uiOverridesRef.current.rehearsalMode
          ? "Rehearsal go live simulated"
          : "PARABLE Broadcast is LIVE",
      };
    },
    [applyStore, guardCommand, recordCommandOutcome],
  );

  const endLive = useCallback(
    async (confirmed = false) => {
      const rehearsal = uiOverridesRef.current.rehearsalMode === true;
      const updated = await runGuardedCommand(
        "stop_live",
        {
          action: "stop_live",
          ...uiOverridesRef.current,
        },
        confirmed,
      );
      applyStore(updated);
      return {
        ok: true as const,
        message: rehearsal ? "Rehearsal ended" : "Broadcast ended",
      };
    },
    [applyStore, runGuardedCommand],
  );

  const recordMitigation = useCallback(
    async (checkId: string) => {
      const { store: next, latencyMs } = await fetchSnapshot(uiOverridesRef.current, checkId);
      saveLastKnownSnapshot(next);
      applyStore(next);
      reportSnapshotSuccess(next, latencyMs);
      return {
        ok: true as const,
        message: `Mitigation logged — interlock state unchanged (${checkId.replace(/_/g, " ")})`,
      };
    },
    [applyStore, reportSnapshotSuccess],
  );

  const subtitle = useMemo(
    () => (store ? dataSourceLabel(store.meta) : "Loading production services…"),
    [store],
  );

  return {
    store,
    loading,
    error,
    subtitle,
    refresh,
    setUiOverrides,
    selectPreview,
    runTransition,
    goLive,
    endLive,
    recordMitigation,
  };
}
