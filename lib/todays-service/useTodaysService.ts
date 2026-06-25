"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  beginServiceApi,
  buildTodaysServiceLiveUrl,
  fetchTodaysService,
  patchTodaysService,
  patchTodaysServiceBroadcastProfile,
  refreshReadinessCheck,
  stopServiceApi,
} from "@/lib/todays-service/api";
import { applyTodaysServiceLiveEvent, type TodaysServiceLiveEvent } from "@/lib/todays-service/live-patch";
import type { ServiceHeaderUpdate } from "@/lib/todays-service/service-header";
import { validateServiceHeaderUpdate } from "@/lib/todays-service/service-header";
import type { TodaysServicePayload } from "@/lib/todays-service/types";

export type ToastState = { type: "success" | "error"; message: string } | null;

type UseTodaysServiceOptions = {
  /** Server-fetched payload — skips client GET on mount when provided. */
  initialData?: TodaysServicePayload;
};

function scheduleAfterFirstPaint(task: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  let cancelled = false;
  const run = () => {
    if (!cancelled) task();
  };

  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;

  const rafId = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (cancelled) return;
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(run, { timeout: 3_000 });
      } else {
        timeoutId = globalThis.setTimeout(run, 1_500);
      }
    });
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
  };
}

function parseLiveEvent(raw: unknown): TodaysServiceLiveEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<TodaysServiceLiveEvent> & Record<string, unknown>;
  if (parsed.type === "todays-service.heartbeat") {
    return parsed as TodaysServiceLiveEvent;
  }
  if (!parsed.readiness) return null;
  return {
    type: "todays-service.update",
    readiness: parsed.readiness as TodaysServiceLiveEvent extends { readiness: infer R } ? R : never,
    alerts: (parsed.alerts as TodaysServiceLiveEvent extends { alerts: infer A } ? A : never) ?? [],
    serviceStartedAt: (parsed.serviceStartedAt as string | null) ?? null,
    streamingDestinations: parsed.streamingDestinations as
      | import("@/lib/todays-service/types").StreamingDestination[]
      | undefined,
    cameras: parsed.cameras as import("@/lib/todays-service/types").Camera[] | undefined,
    at: (parsed.at as string) ?? new Date().toISOString(),
  };
}

export function useTodaysService(options?: UseTodaysServiceOptions) {
  const initialData = options?.initialData;
  const skipInitialFetch = Boolean(initialData);
  const [data, setData] = useState<TodaysServicePayload | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [toast, setToast] = useState<ToastState>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const payload = await fetchTodaysService();
      setData(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load today's service.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipInitialFetch) return;
    void reload();
  }, [reload, skipInitialFetch]);

  useEffect(() => {
    if (!data) return;

    let cancelSchedule = () => {};
    let source: EventSource | null = null;

    cancelSchedule = scheduleAfterFirstPaint(() => {
      setConnection("connecting");
      source = new EventSource(buildTodaysServiceLiveUrl());
      eventSourceRef.current = source;

      source.onopen = () => setConnection("connected");
      source.onerror = () => setConnection("disconnected");

      source.onmessage = (event) => {
        try {
          const payload = parseLiveEvent(JSON.parse(event.data));
          if (!payload) return;
          setData((current) => {
            if (!current) return current;
            return applyTodaysServiceLiveEvent(current, payload) ?? current;
          });
        } catch {
          /* ignore malformed live events */
        }
      };
    });

    return () => {
      cancelSchedule();
      source?.close();
      eventSourceRef.current = null;
    };
  }, [data !== null]);

  const saveHeader = useCallback(
    async (patch: ServiceHeaderUpdate): Promise<{ success: boolean; error?: string }> => {
      const validationError = validateServiceHeaderUpdate(patch);
      if (validationError) {
        showToast("error", validationError);
        return { success: false, error: validationError };
      }

      try {
        const payload = await patchTodaysService(patch);
        setData(payload);
        showToast("success", "Service updated.");
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save service details.";
        showToast("error", message);
        return { success: false, error: message };
      }
    },
    [showToast],
  );

  const saveBroadcastProfile = useCallback(
    async (serviceId: string, broadcastProfile: string): Promise<{ success: boolean; error?: string }> => {
      const trimmed = broadcastProfile.trim();
      if (!serviceId.trim()) {
        const message = "Service id is missing.";
        showToast("error", message);
        return { success: false, error: message };
      }
      if (!trimmed) {
        const message = "Choose a broadcast profile.";
        showToast("error", message);
        return { success: false, error: message };
      }

      try {
        const payload = await patchTodaysServiceBroadcastProfile({
          id: serviceId,
          broadcastProfile: trimmed,
        });
        setData(payload);
        showToast("success", "Broadcast profile updated.");
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save broadcast profile.";
        showToast("error", message);
        return { success: false, error: message };
      }
    },
    [showToast],
  );

  const refreshCheck = useCallback(async () => {
    try {
      const payload = await refreshReadinessCheck();
      setData(payload);
      showToast("success", "Readiness check updated.");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Refresh failed.");
    }
  }, [showToast]);

  const beginService = useCallback(
    async (force = false, skipDestinationIds: string[] = []) => {
      try {
        const result = await beginServiceApi(force, skipDestinationIds);
        if (!result.success) {
          return result;
        }
        await reload();
        showToast("success", result.message);
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not begin service.";
        showToast("error", message);
        return {
          success: false,
          message,
          criticalIssues: [message],
          serviceStartedAt: null,
          redirectUrl: null,
        };
      }
    },
    [reload, showToast],
  );

  const stopService = useCallback(async () => {
    try {
      const result = await stopServiceApi();
      await reload();
      showToast(result.success ? "success" : "error", result.message);
      return result;
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Could not stop service.");
      throw err;
    }
  }, [reload, showToast]);

  const runAction = useCallback(
    async (action: () => Promise<{ success: boolean; message: string }>) => {
      try {
        const result = await action();
        await reload();
        showToast(result.success ? "success" : "error", result.message);
        return result;
      } catch (err) {
        showToast("error", err instanceof Error ? err.message : "Action failed.");
        throw err;
      }
    },
    [reload, showToast],
  );

  return {
    data,
    loading,
    error,
    connection,
    toast,
    reload,
    saveHeader,
    saveBroadcastProfile,
    refreshCheck,
    beginService,
    stopService,
    runAction,
    showToast,
  };
}
