"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!shouldFetch()) {
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
          { cache: "no-store" },
          { subsystem: "countdown" },
        );

        if (!response.ok) throw new Error("fetch failed");
        const data = (await response.json()) as EventCountdownConfig;
        if (cancelled) return;

        setConfig(data);
        setUsingLocalFallback(false);
        saveLastKnownCountdown(data);
        persistCountdownConfig(data);
      } catch {
        if (cancelled) return;

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
        window.cancelIdleCallback(idleId);
      };
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [options.initialConfig, persistCountdownConfig, shouldFetch]);

  return { config, isLoading, usingLocalFallback };
}
