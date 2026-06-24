"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CloudLightning,
  ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Type,
} from "lucide-react";
import CountdownMobileTelemetryStrip from "@/components/broadcast/CountdownMobileTelemetryStrip";
import GoLiveConfirmModal from "@/components/broadcast/GoLiveConfirmModal";
import MobileActionDock from "@/components/broadcast/MobileActionDock";
import MobileEditorTabs, {
  type MobileEditorTab,
} from "@/components/broadcast/MobileEditorTabs";
import TroubleAlertPopup from "@/components/broadcast/TroubleAlertPopup";
import CountdownAdminChatDock from "@/components/ops/CountdownAdminChatDock";
import PublicCountdownChatMonitor from "@/components/countdown/PublicCountdownChatMonitor";
import LobbyCountdownTimer from "@/components/lobby/LobbyCountdownTimer";
import { useCountdownChatTroubleAlerts } from "@/hooks/useCountdownChatTroubleAlerts";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";
import { shouldShowCountdownTimer } from "@/lib/experience/countdown-display";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import {
  computeEventCountdownPhase,
  DEFAULT_COUNTDOWN_CONFIG,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";
import { COUNTDOWN_CONFIG_UPDATED_EVENT } from "@/lib/live/countdown-config-sync";
import {
  OPS_STREAM_ACTION_API_PATH,
  ADMIN_COUNTDOWN_API_PATH,
} from "@/lib/broadcastRoutes";
import {
  validateCountdownScheduleTimes,
} from "@/lib/live/datetime-local";
import {
  formatNowInScheduleTimezone,
  inferScheduleTimezoneFromIso,
  isoToScheduleDatetimeLocal,
  resolveScheduleTimezone,
  scheduleDatetimeLocalToIso,
  type ScheduleTimezone,
} from "@/lib/live/schedule-timezone";
import CountdownAdminScheduleFields, {
  CountdownAdminOutroFields,
} from "@/components/ops/CountdownAdminScheduleFields";
import {
  alignStartForHoldingRoom,
  buildGoLiveAtOffsetMinutes,
  buildHoldingRoomScheduleNow,
  formatCountdownUntilGoLive,
} from "@/lib/live/countdown-schedule-helpers";
import { saveLastKnownCountdown } from "@/lib/parable/last-known-good";
import { computeCountdown } from "@/lib/live/event-lobby";

type CountdownAdminClientProps = {
  adminEmail: string;
  initialConfig: EventCountdownConfig;
  /** Server snapshot so SSR and hydration share the same clock tick. */
  initialPreviewNowMs?: number;
};

function resolveInitialScheduleTimezone(config: EventCountdownConfig): ScheduleTimezone {
  if (config.schedule_timezone) {
    return resolveScheduleTimezone(config.schedule_timezone);
  }
  return inferScheduleTimezoneFromIso(config.start_time);
}

function toScheduleLocal(iso: string, timeZone: ScheduleTimezone): string {
  return isoToScheduleDatetimeLocal(iso, timeZone);
}

function fromScheduleLocal(raw: string, timeZone: ScheduleTimezone): string | null {
  return scheduleDatetimeLocalToIso(raw, timeZone);
}

function FieldLabel({ children }: { children: string }) {
  return (
    <span className="mb-1.5 block font-ui text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-muted">
      {children}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  accent = "blue",
}: {
  icon: React.ReactNode;
  title: string;
  accent?: "blue" | "pink";
}) {
  const accentClass = accent === "pink" ? "text-brand-pink" : "text-brand-blue";
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-brand-border pb-4">
      <span className={accentClass}>{icon}</span>
      <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white">
        {title}
      </h2>
    </div>
  );
}

const inputClassName =
  "w-full min-h-11 rounded-xl border border-brand-border bg-brand-panel/80 px-4 py-3 font-body text-base text-white outline-none transition placeholder:text-brand-muted/45 focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/25 md:min-h-10 md:py-2.5 md:text-sm";

const actionButtonClassName =
  "touch-target inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] transition disabled:opacity-60";

export default function CountdownAdminClient({
  adminEmail,
  initialConfig,
  initialPreviewNowMs,
}: CountdownAdminClientProps) {
  const [form, setForm] = useState<EventCountdownConfig>(() => ({
    ...initialConfig,
    schedule_timezone: resolveInitialScheduleTimezone(initialConfig),
  }));
  const [startLocal, setStartLocal] = useState(() =>
    toScheduleLocal(initialConfig.start_time, resolveInitialScheduleTimezone(initialConfig)),
  );
  const [endLocal, setEndLocal] = useState(() =>
    toScheduleLocal(initialConfig.end_time, resolveInitialScheduleTimezone(initialConfig)),
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileEditorTab>("editor");
  const [previewNow, setPreviewNow] = useState(initialPreviewNowMs ?? Date.now());

  const { opsState } = useOpsStreamStateRealtime();
  const {
    messages: chatMessages,
    isLoading: chatLoading,
    isConnected: chatConnected,
    issueType,
    count: troubleCount,
    clear: clearChatAlert,
  } = useCountdownChatTroubleAlerts();

  const isStreamLive = opsState?.isLive === true;

  useEffect(() => {
    const id = setInterval(() => setPreviewNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const timeZone = resolveScheduleTimezone(form.schedule_timezone);
    setStartLocal(toScheduleLocal(form.start_time, timeZone));
    setEndLocal(toScheduleLocal(form.end_time, timeZone));
  }, [form.end_time, form.schedule_timezone, form.start_time]);

  const previewPhase = useMemo(
    () => computeEventCountdownPhase(form.start_time, form.end_time, previewNow),
    [form.end_time, form.start_time, previewNow],
  );

  const attendeeLiveSurface = useMemo(() => {
    if (previewPhase === "waiting") return "Holding room — countdown to go-live";
    if (previewPhase === "live") return "Live stream POV on /live";
    return "Outro screen on /live";
  }, [previewPhase]);

  const previewCountdown =
    previewPhase !== "waiting"
      ? { days: 0, hours: 0, minutes: 0, seconds: 0, isComplete: true }
      : computeCountdown(form.start_time, previewNow);

  const previewCta = useMemo(() => {
    if (previewPhase === "ended") {
      return { label: form.outro_status_label, disabled: true, href: undefined };
    }
    if (previewPhase === "waiting") {
      return { label: form.cta_label_waiting, disabled: true, href: undefined };
    }
    return { label: form.cta_label_live, disabled: false, href: EXPERIENCE_LIVE_PATH };
  }, [form.cta_label_live, form.cta_label_waiting, previewPhase]);

  const scheduleTimezone = resolveScheduleTimezone(form.schedule_timezone);

  const currentTimeDisplay = formatNowInScheduleTimezone(previewNow, scheduleTimezone);
  const countdownRemainingLabel = formatCountdownUntilGoLive(
    form.start_time,
    previewNow,
  );

  const phaseBadgeClass =
    previewPhase === "live"
      ? "border-brand-pink/50 bg-brand-pink/10 text-brand-pink"
      : previewPhase === "waiting"
        ? "border-brand-blue/50 bg-brand-blue/10 text-brand-blue"
        : "border-brand-border bg-brand-panel text-brand-muted";

  const updateField = useCallback(
    <K extends keyof EventCountdownConfig>(key: K, value: EventCountdownConfig[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
      setStatus(null);
      setError(null);
    },
    [],
  );

  const applyGoLivePreset = useCallback(
    (minutesFromNow: number) => {
      const iso = buildGoLiveAtOffsetMinutes(minutesFromNow, previewNow);
      const timeZone = resolveScheduleTimezone(form.schedule_timezone);
      setStartLocal(toScheduleLocal(iso, timeZone));
      updateField("start_time", iso);
    },
    [form.schedule_timezone, previewNow, updateField],
  );

  const handleScheduleTimezoneChange = useCallback(
    (timeZone: ScheduleTimezone) => {
      const resolved = resolveScheduleTimezone(timeZone);
      updateField("schedule_timezone", resolved);
      setStartLocal(toScheduleLocal(form.start_time, resolved));
      setEndLocal(toScheduleLocal(form.end_time, resolved));
    },
    [form.end_time, form.start_time, updateField],
  );

  const handleGoLiveLocalChange = useCallback(
    (raw: string, isoOverride: string | null) => {
      setStartLocal(raw);
      setStatus(null);
      setError(null);
      const timeZone = resolveScheduleTimezone(form.schedule_timezone);
      const iso = isoOverride ?? fromScheduleLocal(raw, timeZone);
      if (iso) updateField("start_time", iso);
    },
    [form.schedule_timezone, updateField],
  );

  const handleShowEndLocalChange = useCallback(
    (raw: string, isoOverride: string | null) => {
      setEndLocal(raw);
      setStatus(null);
      setError(null);
      const timeZone = resolveScheduleTimezone(form.schedule_timezone);
      const iso = isoOverride ?? fromScheduleLocal(raw, timeZone);
      if (iso) updateField("end_time", iso);
    },
    [form.schedule_timezone, updateField],
  );

  const applyScheduleFromLocalInputs = useCallback((): EventCountdownConfig | null => {
    const timeZone = resolveScheduleTimezone(form.schedule_timezone);
    const startIso = fromScheduleLocal(startLocal, timeZone);
    const endIso = fromScheduleLocal(endLocal, timeZone);

    if (!startIso || !endIso) {
      setError("Enter valid go-live and show-end times.");
      return null;
    }

    const scheduleError = validateCountdownScheduleTimes(startIso, endIso);
    if (scheduleError) {
      setError(scheduleError);
      return null;
    }

    return {
      ...form,
      start_time: startIso,
      end_time: endIso,
    };
  }, [endLocal, form, startLocal]);

  const persistConfig = useCallback(async (configToSave: EventCountdownConfig) => {
    const scheduleError = validateCountdownScheduleTimes(
      configToSave.start_time,
      configToSave.end_time,
    );
    if (scheduleError) {
      setError(scheduleError);
      return null;
    }

    setIsSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch(ADMIN_COUNTDOWN_API_PATH, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configToSave),
        cache: "no-store",
      });

      const payload = (await response.json()) as EventCountdownConfig & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save configuration.");
      }

      setForm(payload);
      saveLastKnownCountdown(payload);
      window.dispatchEvent(new Event(COUNTDOWN_CONFIG_UPDATED_EVENT));
      return payload;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save configuration.");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleSave = async () => {
    const configToSave = applyScheduleFromLocalInputs();
    if (!configToSave) return;

    const saved = await persistConfig(configToSave);
    if (saved) setStatus("Configuration saved.");
  };

  const handleRestoreHoldingRoom = async () => {
    const alignedStart = alignStartForHoldingRoom(
      form.start_time,
      form.end_time,
      previewNow,
    );
    const schedule = alignedStart
      ? { start_time: alignedStart, end_time: form.end_time }
      : buildHoldingRoomScheduleNow(previewNow);

    const timeZone = resolveScheduleTimezone(form.schedule_timezone);
    setStartLocal(toScheduleLocal(schedule.start_time, timeZone));
    setEndLocal(toScheduleLocal(schedule.end_time, timeZone));

    const saved = await persistConfig({ ...form, ...schedule });

    if (saved) {
      setStatus(
        alignedStart
          ? "Holding room restored — start aligned before end and saved."
          : "Holding room restored — start set ~90 minutes ahead and saved.",
      );
    }
  };

  const handleRampLivePreview = useCallback(() => {
    const rampStart = new Date(previewNow);
    rampStart.setMinutes(rampStart.getMinutes() - 5);
    const iso = rampStart.toISOString();
    const timeZone = resolveScheduleTimezone(form.schedule_timezone);
    setStartLocal(toScheduleLocal(iso, timeZone));
    updateField("start_time", iso);
    setStatus("Preview ramped to live phase — save to publish.");
  }, [form.schedule_timezone, previewNow, updateField]);

  const handleReset = () => {
    const schedule = buildHoldingRoomScheduleNow(previewNow);
    const resetConfig: EventCountdownConfig = {
      ...DEFAULT_COUNTDOWN_CONFIG,
      ...schedule,
    };

    setForm(resetConfig);
    const timeZone = resolveScheduleTimezone(resetConfig.schedule_timezone);
    setStartLocal(toScheduleLocal(schedule.start_time, timeZone));
    setEndLocal(toScheduleLocal(schedule.end_time, timeZone));
    setStatus(
      "Reset hero copy to defaults with a fresh holding-room schedule (~90 min ahead). Save to publish.",
    );
    setError(null);
  };

  const handleGoLiveConfirm = async () => {
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
        countdownSynced?: boolean;
      };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Go Live failed.");
      }

      setIsGoLiveOpen(false);
      setStatus(
        data.countdownSynced
          ? "Broadcast is live — schedule synced for attendee /live."
          : "Broadcast is live for all attendees.",
      );
      window.dispatchEvent(new Event(COUNTDOWN_CONFIG_UPDATED_EVENT));
    } catch (goLiveError) {
      setLaunchError(
        goLiveError instanceof Error ? goLiveError.message : "Go Live failed.",
      );
    } finally {
      setIsLaunching(false);
    }
  };

  const chatMonitor = (
    <PublicCountdownChatMonitor
      messages={chatMessages}
      isLoading={chatLoading}
      isConnected={chatConnected}
      layout="sidebar"
    />
  );

  return (
    <main className="min-h-dvh w-full bg-brand-black pt-safe pb-24 text-white lg:pb-safe">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[min(40vh,22rem)] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,168,255,0.12),transparent)]" />

      <section className="relative border-b border-brand-border px-4 pb-8 pt-4 md:px-8 lg:px-10">
        <div className="relative mx-auto w-full max-w-xl">
          <div
            className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(0,168,255,0.14),transparent_70%)] blur-2xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto aspect-[3/2] w-full">
            <Image
              src={EXPERIENCE_BRAND_ASSETS.lockup}
              alt="300 Awakening"
              fill
              priority
              sizes="(max-width: 640px) 90vw, 576px"
              className="object-contain"
            />
          </div>
        </div>

        <div className="relative z-40 mx-auto mt-6 flex w-full max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link
            href="/ops"
            prefetch={false}
            className="inline-flex min-h-11 items-center gap-2 font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-brand-muted transition hover:text-brand-blue"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Ops
          </Link>

          <div className="relative z-40 flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => void handleRestoreHoldingRoom()}
              disabled={isSaving}
              className={`${actionButtonClassName} border-brand-blue/40 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20`}
            >
              Restore Holding Room
            </button>
            <button
              type="button"
              onClick={handleReset}
              className={`${actionButtonClassName} border-brand-border bg-brand-panel text-brand-muted hover:border-brand-blue/30 hover:text-white`}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className={`${actionButtonClassName} border-brand-pink/50 bg-brand-pink/15 text-white hover:bg-brand-pink/25`}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsGoLiveOpen(true)}
              disabled={isLaunching}
              className={`${actionButtonClassName} border-brand-pink/50 bg-brand-pink text-white hover:bg-brand-pink/90 disabled:opacity-40`}
            >
              <CloudLightning className="h-3.5 w-3.5" aria-hidden="true" />
              {isStreamLive ? "On Air — Re-sync" : "Go Live"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-2xl text-center">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-blue">
            Ops Console
          </p>
          <h1 className="mt-2 font-headline text-fluid-section uppercase tracking-[0.12em]">
            Countdown Hero Editor
          </h1>
          <p className="mt-3 font-body text-sm text-brand-muted">
            Configure the attendee holding-room hero on{" "}
            <span className="text-white">/live</span>. Signed in as{" "}
            <span className="text-brand-blue">{adminEmail}</span>.
          </p>
        </div>

        {(status || error || launchError) && (
          <div
            className={`mx-auto mt-6 max-w-2xl rounded-xl border px-4 py-3 text-center font-body text-sm ${
              error || launchError
                ? "border-red-500/40 bg-red-500/10 text-red-200"
                : "border-brand-blue/40 bg-brand-blue/10 text-brand-blue"
            }`}
            role="status"
          >
            {error ?? launchError ?? status}
          </div>
        )}
      </section>

      <div className="relative w-full px-[clamp(0.75rem,3vw,2.5rem)] py-6 md:px-8 lg:px-10">
        <div className="lg:hidden">
          <CountdownMobileTelemetryStrip opsState={opsState} />
        </div>

        <div className="lg:hidden">
          <MobileEditorTabs activeTab={mobileTab} onTabChange={setMobileTab} />
        </div>

        <div className="mx-auto grid w-full max-w-[90rem] grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Live Preview — first on mobile/tablet, sticky right column on desktop (~60%) */}
          <aside className="order-1 lg:order-2 lg:col-span-7 xl:col-span-7">
            <section className="glass-panel rounded-2xl border border-brand-border p-4 sm:p-5 lg:sticky lg:top-6 lg:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-brand-pink" aria-hidden="true" />
                  <div>
                    <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-white">
                      Live Preview
                    </h2>
                    <p className="mt-1 font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                      Attendee /live: {attendeeLiveSurface}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRampLivePreview}
                    className="touch-target inline-flex min-h-11 items-center rounded-full border border-brand-pink/50 bg-brand-pink/15 px-4 py-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-pink transition hover:bg-brand-pink/25"
                  >
                    Ramp Live
                  </button>
                  <span
                    className={`rounded-full border px-3 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] ${phaseBadgeClass}`}
                  >
                    Phase: {previewPhase}
                  </span>
                </div>
              </div>

              <div className="mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-brand-border bg-brand-panel/80">
                <div
                  className="relative aspect-[9/16] w-full max-h-[min(72vh,40rem)] sm:aspect-[3/4] lg:aspect-[9/16] lg:max-h-none"
                  aria-label="Attendee holding room preview"
                >
                  <div className="absolute inset-0 flex flex-col bg-brand-black/90">
                    <div className="border-b border-brand-border bg-brand-black/60 px-4 py-3 text-center sm:px-6">
                      <p className="font-ui text-[clamp(0.55rem,2.5vw,0.62rem)] font-bold uppercase tracking-[0.2em] text-brand-blue">
                        {form.eyebrow.trim() || "YOU'RE ALMOST LIVE"}
                      </p>
                    </div>

                    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-6 text-center sm:gap-5 sm:px-6 sm:py-8">
                      <p className="font-headline text-[clamp(1.1rem,4.5vw,1.75rem)] uppercase leading-tight tracking-[0.08em] text-white">
                        {form.headline.trim() || "THE AWAKENING BEGINS SOON"}
                      </p>
                      <p className="max-w-md font-body text-[clamp(0.65rem,2.8vw,0.75rem)] uppercase tracking-[0.12em] text-brand-muted">
                        {form.subtitle.trim() || "Subtitle"}
                      </p>

                      {form.status_label.trim() ? (
                        <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-purple">
                          {form.status_label}
                        </p>
                      ) : null}

                      {shouldShowCountdownTimer(form, false) && previewPhase === "waiting" ? (
                        <div className="w-full max-w-xs scale-[0.92] sm:scale-100">
                          <LobbyCountdownTimer
                            config={form}
                            countdown={previewCountdown}
                            eventPhase={previewPhase}
                            showTimer
                            variant="hms"
                          />
                        </div>
                      ) : (
                        <div className="w-full max-w-xs rounded-xl border border-dashed border-brand-border/80 px-3 py-6 sm:px-4 sm:py-8">
                          <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted sm:text-[0.52rem]">
                            {previewPhase === "live"
                              ? "Countdown hidden — live stream active"
                              : "Countdown not shown in this phase"}
                          </p>
                        </div>
                      )}

                      <span
                        className={`inline-flex min-h-11 min-w-[min(100%,14rem)] items-center justify-center rounded-full border px-6 font-ui text-[clamp(0.52rem,2.5vw,0.58rem)] font-bold uppercase tracking-[0.12em] ${
                          previewCta.disabled
                            ? "cursor-not-allowed border-brand-border bg-brand-panel text-brand-muted"
                            : "border-brand-pink/40 bg-brand-pink/10 text-brand-pink"
                        }`}
                        aria-disabled={previewCta.disabled}
                      >
                        {previewCta.label.trim() || "ENTER LIVE EXPERIENCE"}
                      </span>

                      {form.helper_text.trim() ? (
                        <p className="max-w-sm font-body text-[clamp(0.65rem,2.5vw,0.75rem)] leading-relaxed text-brand-muted">
                          {form.helper_text}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </aside>

          {/* Editor controls — below preview on mobile/tablet, left column on desktop (~40%) */}
          <div
            className={`order-2 space-y-6 lg:order-1 lg:col-span-5 xl:col-span-5 ${
              mobileTab === "chat" ? "hidden lg:block" : ""
            }`}
          >
              <section className="glass-panel rounded-2xl border border-brand-border p-5 sm:p-6">
                <SectionHeader icon={<Type className="h-4 w-4" />} title="Hero Copy" />

                <div className="space-y-4">
                  <label className="block">
                    <FieldLabel>Eyebrow</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.eyebrow}
                      onChange={(e) => updateField("eyebrow", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Headline</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.headline}
                      onChange={(e) => updateField("headline", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Subtitle</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.subtitle}
                      onChange={(e) => updateField("subtitle", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Status Label</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.status_label}
                      onChange={(e) => updateField("status_label", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Helper Text</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.helper_text}
                      onChange={(e) => updateField("helper_text", e.target.value)}
                    />
                  </label>
                </div>
              </section>

              <CountdownAdminScheduleFields
                form={form}
                previewPhase={previewPhase}
                currentTimeDisplay={currentTimeDisplay}
                countdownRemainingLabel={countdownRemainingLabel}
                goLiveLocal={startLocal}
                showEndLocal={endLocal}
                scheduleTimezone={scheduleTimezone}
                onGoLiveLocalChange={handleGoLiveLocalChange}
                onShowEndLocalChange={handleShowEndLocalChange}
                onApplyGoLivePreset={applyGoLivePreset}
                onScheduleTimezoneChange={handleScheduleTimezoneChange}
                updateField={updateField}
              />

              <CountdownAdminOutroFields form={form} updateField={updateField} />

              <section className="glass-panel rounded-2xl border border-brand-border p-5 sm:p-6">
                <SectionHeader
                  icon={<ImageIcon className="h-4 w-4" />}
                  title="Asset Paths"
                  accent="pink"
                />

                <div className="space-y-4">
                  <label className="block">
                    <FieldLabel>Hero Background</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.hero_background_url}
                      onChange={(e) => updateField("hero_background_url", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Countdown Frame</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.countdown_frame_url}
                      onChange={(e) => updateField("countdown_frame_url", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Waiting Signal Pill</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.waiting_pill_url}
                      onChange={(e) => updateField("waiting_pill_url", e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <FieldLabel>Button Frame</FieldLabel>
                    <input
                      className={inputClassName}
                      value={form.button_frame_url}
                      onChange={(e) => updateField("button_frame_url", e.target.value)}
                    />
                  </label>
                </div>

                <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-brand-border bg-brand-panel/60 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateField("is_active", e.target.checked)}
                    className="h-4 w-4 accent-brand-pink"
                  />
                  <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white">
                    Active on attendee dashboard
                  </span>
                </label>
              </section>
          </div>

          {mobileTab === "chat" ? (
            <div className="countdown-admin-mobile-chat order-3 min-h-[45vh] px-1 pb-4 lg:hidden">
              {chatMonitor}
            </div>
          ) : null}
        </div>
      </div>

      <CountdownAdminChatDock
        messages={chatMessages}
        isLoading={chatLoading}
        isConnected={chatConnected}
        troubleCount={troubleCount}
      />

      <div className="lg:hidden">
        <MobileActionDock
          onSettingsClick={() => setMobileTab("editor")}
          onSaveClick={() => void handleSave()}
          onGoLiveClick={() => setIsGoLiveOpen(true)}
          canSave
          canGoLive={!isLaunching}
          isSaving={isSaving}
          isLive={isStreamLive}
          saveLabel={status === "Configuration saved." ? "Saved" : undefined}
        />
      </div>

      <div className="hidden lg:block">
        <TroubleAlertPopup
          issueType={issueType}
          count={troubleCount}
          onClear={clearChatAlert}
          variant="desktop"
        />
      </div>
      <div className="lg:hidden">
        <TroubleAlertPopup
          issueType={issueType}
          count={troubleCount}
          onClear={clearChatAlert}
          variant="mobile"
        />
      </div>

      <GoLiveConfirmModal
        isOpen={isGoLiveOpen}
        isLaunching={isLaunching}
        alreadyLive={isStreamLive}
        onClose={() => setIsGoLiveOpen(false)}
        onConfirm={() => void handleGoLiveConfirm()}
      />
    </main>
  );
}
