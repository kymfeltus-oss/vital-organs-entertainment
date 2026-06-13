"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_COUNTDOWN_CONFIG,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";

type UseCountdownConfigOptions = {
  initialConfig?: EventCountdownConfig;
};

export function useCountdownConfig(options: UseCountdownConfigOptions = {}) {
  const [config, setConfig] = useState<EventCountdownConfig>(
    options.initialConfig ?? DEFAULT_COUNTDOWN_CONFIG,
  );
  const [isLoading, setIsLoading] = useState(!options.initialConfig);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/countdown", { cache: "no-store" });
        if (!response.ok) throw new Error("fetch failed");
        const data = (await response.json()) as EventCountdownConfig;
        if (!cancelled) setConfig(data);
      } catch {
        if (!cancelled && !options.initialConfig) {
          setConfig(DEFAULT_COUNTDOWN_CONFIG);
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
  }, [options.initialConfig]);

  return { config, isLoading };
}
