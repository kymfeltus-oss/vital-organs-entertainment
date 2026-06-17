"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_COUNTDOWN_CONFIG,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";
import {
  loadLastKnownCountdown,
  saveLastKnownCountdown,
} from "@/lib/parable/last-known-good";
import { useParableSubsystem } from "@/lib/parable/useParableSubsystem";
import { parableFetch } from "@/lib/parable/resilient-fetch";
import { useBroadcastHealth } from "@/lib/parable/BroadcastHealthContext";

type UseCountdownConfigOptions = {
  initialConfig?: EventCountdownConfig;
};

export function useCountdownConfig(options: UseCountdownConfigOptions = {}) {
  const { shouldFetch } = useParableSubsystem("countdown");
  const { persistCountdownConfig } = useBroadcastHealth();
  const [config, setConfig] = useState<EventCountdownConfig>(() => {
    if (options.initialConfig) return options.initialConfig;
    return loadLastKnownCountdown() ?? DEFAULT_COUNTDOWN_CONFIG;
  });
  const [isLoading, setIsLoading] = useState(!options.initialConfig);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);
  const shouldFetchRef = useRef(shouldFetch);
  const persistCountdownConfigRef = useRef(persistCountdownConfig);
  shouldFetchRef.current = shouldFetch;
  persistCountdownConfigRef.current = persistCountdownConfig;

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    async function load() {
      if (!shouldFetchRef.current()) {
        const cached = loadLastKnownCountdown();
        if (cached && !cancelled) {
          setConfig(cached);
          setUsingLocalFallback(true);
        }
        setIsLoading(false);
        return;
      }

      try {
        const { response } = await parableFetch(
          "/api/countdown",
          { cache: "no-store", signal: abortController.signal },
          { subsystem: "countdown" },
        );

        if (!response.ok) throw new Error("fetch failed");
        const data = (await response.json()) as EventCountdownConfig;
        if (cancelled) return;

        setConfig(data);
        setUsingLocalFallback(false);
        saveLastKnownCountdown(data);
        persistCountdownConfigRef.current(data);
      } catch {
        if (abortController.signal.aborted || cancelled) return;

        const cached = loadLastKnownCountdown();
        if (cached) {
          setConfig(cached);
          setUsingLocalFallback(true);
        } else if (!options.initialConfig) {
          setConfig(DEFAULT_COUNTDOWN_CONFIG);
          setUsingLocalFallback(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(() => {
        void load();
      }, { timeout: 1_000 });
      return () => {
        cancelled = true;
        abortController.abort();
        window.cancelIdleCallback(idleId);
      };
    }

    void load();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [options.initialConfig]);

  return { config, isLoading, usingLocalFallback };
}
