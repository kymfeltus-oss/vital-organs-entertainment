"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BROADCAST_SNAPSHOT_POLL_MS } from "@/lib/broadcast/config";
import {
  dataSourceLabel,
  mergeProductionStore,
  type ProductionUiOverrides,
} from "@/lib/broadcast/productionStore";
import type { ProductionStore, TransitionType } from "@/lib/broadcast/types";

async function fetchSnapshot(
  uiOverrides: ProductionUiOverrides,
  mitigationCheckId?: string,
): Promise<ProductionStore> {
  const params = new URLSearchParams();
  if (uiOverrides.supervisorOverride) params.set("supervisorOverride", "true");
  if (uiOverrides.supervisorReason) {
    params.set("supervisorReason", uiOverrides.supervisorReason);
  }
  if (uiOverrides.rehearsalMode) params.set("rehearsalMode", "true");
  if (mitigationCheckId) params.set("mitigationCheckId", mitigationCheckId);

  const query = params.toString();
  const response = await fetch(
    `/api/broadcast/snapshot${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("Unable to load production snapshot.");
  }

  return response.json() as Promise<ProductionStore>;
}

async function postCommand(
  body: Record<string, unknown>,
): Promise<ProductionStore> {
  const response = await fetch("/api/broadcast/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Production command failed.");
  }

  const payload = (await response.json()) as { store: ProductionStore };
  return payload.store;
}

export function useProductionStore() {
  const [store, setStore] = useState<ProductionStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uiOverridesRef = useRef<ProductionUiOverrides>({});

  const refresh = useCallback(async () => {
    try {
      const next = await fetchSnapshot(uiOverridesRef.current);
      setStore(mergeProductionStore(next, uiOverridesRef.current));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot refresh failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, BROADCAST_SNAPSHOT_POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [refresh]);

  const setUiOverrides = useCallback((overrides: ProductionUiOverrides) => {
    uiOverridesRef.current = { ...uiOverridesRef.current, ...overrides };
    setStore((current) =>
      current ? mergeProductionStore(current, uiOverridesRef.current) : current,
    );
  }, []);

  const selectPreview = useCallback(
    async (sourceId: string) => {
      const updated = await postCommand({
        action: "set_preview",
        sourceId,
        ...uiOverridesRef.current,
      });
      setStore(mergeProductionStore(updated, uiOverridesRef.current));
      return { ok: true as const, message: "Loaded into Preview" };
    },
    [],
  );

  const runTransition = useCallback(async (transition: TransitionType) => {
    const updated = await postCommand({
      action: "transition",
      transition,
      ...uiOverridesRef.current,
    });
    setStore(mergeProductionStore(updated, uiOverridesRef.current));

    const labels: Record<TransitionType, string> = {
      cut: "Cut to Preview",
      take: "Take — Preview to Program",
      fade: "Fade to Program",
      stinger: "Stinger fired",
    };
    return { ok: true as const, message: labels[transition] };
  }, []);

  const goLive = useCallback(async () => {
    const response = await fetch("/api/broadcast/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "go_live",
        ...uiOverridesRef.current,
      }),
    });

    const payload = (await response.json()) as {
      store?: ProductionStore;
      error?: string;
    };

    if (!response.ok) {
      if (payload.store) {
        setStore(mergeProductionStore(payload.store, uiOverridesRef.current));
      }
      throw new Error(payload.error ?? "Go live blocked by readiness interlock.");
    }

    if (!payload.store) {
      throw new Error("Go live response missing production store.");
    }

    setStore(mergeProductionStore(payload.store, uiOverridesRef.current));
    return {
      ok: true as const,
      message: uiOverridesRef.current.rehearsalMode
        ? "Rehearsal go live simulated"
        : "PARABLE Broadcast is LIVE",
    };
  }, []);

  const endLive = useCallback(async () => {
    const rehearsal = uiOverridesRef.current.rehearsalMode === true;
    const updated = await postCommand({
      action: "stop_live",
      ...uiOverridesRef.current,
    });
    setStore(mergeProductionStore(updated, uiOverridesRef.current));
    return {
      ok: true as const,
      message: rehearsal ? "Rehearsal ended" : "Broadcast ended",
    };
  }, []);

  const recordMitigation = useCallback(async (checkId: string) => {
    const next = await fetchSnapshot(uiOverridesRef.current, checkId);
    setStore(mergeProductionStore(next, uiOverridesRef.current));
    return {
      ok: true as const,
      message: `Mitigation logged — interlock state unchanged (${checkId.replace(/_/g, " ")})`,
    };
  }, []);

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
