"use client";

import { useCallback, useRef, useState } from "react";
import type { HeroCopyFormState } from "@/lib/broadcast/countdown-console-types";
import { DEFAULT_HERO_COPY_FORM } from "@/lib/broadcast/countdown-console-types";
import {
  ADMIN_COUNTDOWN_API_PATH,
  OPS_STREAM_ACTION_API_PATH,
} from "@/lib/broadcastRoutes";
import { COUNTDOWN_CONFIG_UPDATED_EVENT } from "@/lib/live/countdown-config-sync";
import {
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";
import { validateCountdownScheduleTimes } from "@/lib/live/datetime-local";
import {
  isoToScheduleDatetimeLocal,
  resolveScheduleTimezone,
  scheduleDatetimeLocalToIso,
} from "@/lib/live/schedule-timezone";
import { saveLastKnownCountdown } from "@/lib/parable/last-known-good";

export function heroFormFromConfig(config: EventCountdownConfig): HeroCopyFormState {
  const timezone = resolveScheduleTimezone(config.schedule_timezone);
  const localStart = isoToScheduleDatetimeLocal(config.start_time, timezone);
  const [showDate = "", showTime = ""] = localStart.split("T");

  return {
    eyebrow: config.eyebrow || DEFAULT_HERO_COPY_FORM.eyebrow,
    headline: config.headline || DEFAULT_HERO_COPY_FORM.headline,
    subtitle: config.subtitle || DEFAULT_HERO_COPY_FORM.subtitle,
    statusLabel: config.status_label || DEFAULT_HERO_COPY_FORM.statusLabel,
    showDate,
    showTime,
    timezone,
  };
}

function configFromHeroForm(
  form: HeroCopyFormState,
  base: EventCountdownConfig,
): EventCountdownConfig | null {
  const timezone = resolveScheduleTimezone(form.timezone);
  let start_time = base.start_time;

  if (form.showDate && form.showTime) {
    const iso = scheduleDatetimeLocalToIso(`${form.showDate}T${form.showTime}`, timezone);
    if (!iso) return null;
    start_time = iso;
  }

  const scheduleError = validateCountdownScheduleTimes(start_time, base.end_time);
  if (scheduleError) return null;

  return {
    ...base,
    eyebrow: form.eyebrow.trim(),
    headline: form.headline.trim(),
    subtitle: form.subtitle.trim(),
    status_label: form.statusLabel.trim(),
    start_time,
    schedule_timezone: timezone,
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
  resetToLoadedState: () => void;
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
  const loadedConfigRef = useRef<EventCountdownConfig>(initialConfig);
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

  const resetToLoadedState = useCallback(() => {
    const loaded = loadedConfigRef.current;
    setConfig(loaded);
    setFormState(heroFormFromConfig(loaded));
    setSaveSuccess(false);
    setSaveError(null);
    setLaunchError(null);
  }, []);

  const saveHeroCopyForm = useCallback(async (): Promise<boolean> => {
    const payload = configFromHeroForm(formState, config);
    if (!payload) {
      setSaveError("Enter a valid show date, time, and timezone.");
      return false;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(ADMIN_COUNTDOWN_API_PATH, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = (await response.json()) as EventCountdownConfig & { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save configuration.");
      }

      loadedConfigRef.current = data;
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
      const response = await fetch(OPS_STREAM_ACTION_API_PATH, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "go_live" }),
        cache: "no-store",
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Go Live failed.");
      }

      window.dispatchEvent(new Event(COUNTDOWN_CONFIG_UPDATED_EVENT));
      return true;
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : "Go Live failed.");
      return false;
    } finally {
      setIsLaunching(false);
    }
  }, []);

  const mergedConfig =
    configFromHeroForm(formState, config) ?? config;

  return {
    formState,
    config: mergedConfig,
    setField,
    saveHeroCopyForm,
    resetToLoadedState,
    launchBroadcast,
    isSaving,
    saveError,
    saveSuccess,
    isLaunching,
    launchError,
  };
}
