"use client";

import { useCallback, useMemo, useState } from "react";
import type { HeroCopyFormState } from "@/lib/broadcast/countdown-console-types";
import { DEFAULT_HERO_COPY_FORM } from "@/lib/broadcast/countdown-console-types";
import {
  ADMIN_COUNTDOWN_API_PATH,
  OPS_GO_LIVE_API_PATH,
} from "@/lib/broadcastRoutes";
import { COUNTDOWN_CONFIG_UPDATED_EVENT } from "@/lib/live/countdown-config-sync";
import {
  DEFAULT_COUNTDOWN_CONFIG,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";
import { saveLastKnownCountdown } from "@/lib/parable/last-known-good";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function heroFormFromConfig(config: EventCountdownConfig): HeroCopyFormState {
  const start = new Date(config.start_time);
  const showDate = Number.isNaN(start.getTime())
    ? ""
    : `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`;
  const showTime = Number.isNaN(start.getTime())
    ? ""
    : `${pad2(start.getHours())}:${pad2(start.getMinutes())}`;

  return {
    eyebrow: config.eyebrow || DEFAULT_HERO_COPY_FORM.eyebrow,
    headline: config.headline || DEFAULT_HERO_COPY_FORM.headline,
    subtitle: config.subtitle || DEFAULT_HERO_COPY_FORM.subtitle,
    statusLabel: config.status_label || DEFAULT_HERO_COPY_FORM.statusLabel,
    showDate,
    showTime,
    timezone: DEFAULT_HERO_COPY_FORM.timezone,
  };
}

function scheduleToIso(showDate: string, showTime: string): string | null {
  if (!showDate || !showTime) return null;
  const ms = new Date(`${showDate}T${showTime}`).getTime();
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function configFromHeroForm(
  form: HeroCopyFormState,
  base: EventCountdownConfig,
): EventCountdownConfig {
  const startIso = scheduleToIso(form.showDate, form.showTime) ?? base.start_time;
  return {
    ...base,
    eyebrow: form.eyebrow.trim(),
    headline: form.headline.trim(),
    subtitle: form.subtitle.trim(),
    status_label: form.statusLabel.trim(),
    start_time: startIso,
  };
}

type UseCountdownHeroEditorOptions = {
  initialConfig: EventCountdownConfig;
};

type UseCountdownHeroEditorResult = {
  formState: HeroCopyFormState;
  config: EventCountdownConfig;
  setField: <K extends keyof HeroCopyFormState>(key: K, value: HeroCopyFormState[K]) => void;
  saveHeroCopyForm: () => Promise<boolean>;
  launchBroadcast: () => Promise<boolean>;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  isLaunching: boolean;
  launchError: string | null;
};

/** Countdown hero editor form + persistence + go-live launcher. */
export function useCountdownHeroEditor({
  initialConfig,
}: UseCountdownHeroEditorOptions): UseCountdownHeroEditorResult {
  const [config, setConfig] = useState<EventCountdownConfig>(initialConfig);
  const [formState, setFormState] = useState<HeroCopyFormState>(() =>
    heroFormFromConfig(initialConfig),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const setField = useCallback(
    <K extends keyof HeroCopyFormState>(key: K, value: HeroCopyFormState[K]) => {
      setFormState((current) => ({ ...current, [key]: value }));
      setSaveSuccess(false);
      setSaveError(null);
    },
    [],
  );

  const mergedConfig = useMemo(
    () => configFromHeroForm(formState, config),
    [config, formState],
  );

  const saveHeroCopyForm = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload = configFromHeroForm(formState, config);
      const response = await fetch(ADMIN_COUNTDOWN_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as EventCountdownConfig & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save configuration.");
      }

      setConfig(data);
      setFormState(heroFormFromConfig(data));
      saveLastKnownCountdown(data);
      window.dispatchEvent(new Event(COUNTDOWN_CONFIG_UPDATED_EVENT));
      setSaveSuccess(true);
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save configuration.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [config, formState]);

  const launchBroadcast = useCallback(async (): Promise<boolean> => {
    setIsLaunching(true);
    setLaunchError(null);

    try {
      const response = await fetch(OPS_GO_LIVE_API_PATH, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "go_live" }),
        cache: "no-store",
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Go Live failed.");
      }

      return true;
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : "Go Live failed.");
      return false;
    } finally {
      setIsLaunching(false);
    }
  }, []);

  return {
    formState,
    config: mergedConfig,
    setField,
    saveHeroCopyForm,
    launchBroadcast,
    isSaving,
    saveError,
    saveSuccess,
    isLaunching,
    launchError,
  };
}

export { DEFAULT_COUNTDOWN_CONFIG };
