"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { Check, Clock3, Copy, ExternalLink, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import HoldingRoomCountdownOverlay from "@/components/features/live/holding-room/HoldingRoomCountdownOverlay";
import OwnerProductionSideMenu from "@/components/owner/OwnerProductionSideMenu";
import {
  HOLDING_ROOM_ART_NATIVE,
} from "@/lib/experience/holding-room-assets";
import {
  MOBILE_ARTBOARD_FULL_SHELL,
  mobileArtboardStageStyle,
} from "@/lib/responsive";
import type { ShowSetupState } from "@/lib/owner/show-setup-state";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";
import {
  isoToScheduleDatetimeLocal,
  scheduleDatetimeLocalToIso,
  type ScheduleTimezone,
} from "@/lib/live/schedule-timezone";
import {
  DEFAULT_COUNTDOWN_CONFIG,
  type EventCountdownConfig,
} from "@/lib/live/countdown-config";

const EVENT_TIMEZONE: ScheduleTimezone = "America/Chicago";

type ShowSetupResponse = {
  state?: ShowSetupState;
  message?: string;
  error?: string;
};

type CountdownResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
};

type OwnerCountdownControlClientProps = {
  initialState?: ShowSetupState;
};

function normalizeHostInputs(hostNames: string[] | undefined): string[] {
  const cleaned = (hostNames ?? []).map((host) => host.trim()).filter(Boolean);
  return cleaned.length ? cleaned : [""];
}

function buildPreviewEndIso(startIso: string): string {
  const startMs = new Date(startIso).getTime();
  if (Number.isNaN(startMs)) return DEFAULT_COUNTDOWN_CONFIG.end_time;
  return new Date(startMs + 4 * 60 * 60 * 1_000).toISOString();
}

export default function OwnerCountdownControlClient({
  initialState,
}: OwnerCountdownControlClientProps) {
  const timezone = EVENT_TIMEZONE;
  const initialDateTimeLocal = initialState?.targetDateTime
    ? isoToScheduleDatetimeLocal(initialState.targetDateTime, timezone)
    : "";
  const [eventName, setEventName] = useState(initialState?.showTitle ?? "");
  const [presenterName, setPresenterName] = useState(initialState?.presenterName ?? "");
  const [eventLocation, setEventLocation] = useState(initialState?.eventLocation ?? "");
  const [livestreamAvailability, setLivestreamAvailability] = useState(
    initialState?.livestreamAvailability ?? "",
  );
  const [hostNames, setHostNames] = useState<string[]>(
    normalizeHostInputs(initialState?.hostNames),
  );
  const [dateTimeLocal, setDateTimeLocal] = useState(initialDateTimeLocal);
  const [previewReady] = useState(true);
  const loading = false;
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(
    initialState
      ? "Saved countdown details loaded. Edit fields only when you are ready to update them."
      : "Enter the event details, then save and publish the countdown.",
  );
  const [tone, setTone] = useState<"info" | "success" | "error">("info");

  const targetIso = useMemo(
    () => scheduleDatetimeLocalToIso(dateTimeLocal, timezone) ?? DEFAULT_COUNTDOWN_CONFIG.start_time,
    [dateTimeLocal, timezone],
  );

  const saveSchedule = useCallback(async () => {
    if (pending) return;
    if (!eventName.trim()) {
      setTone("error");
      setMessage("Enter an event name before saving.");
      return;
    }
    const parsedIso = scheduleDatetimeLocalToIso(dateTimeLocal, timezone);
    if (!parsedIso) {
      setTone("error");
      setMessage("Choose a valid event date and time.");
      return;
    }

    setPending(true);
    setTone("info");
    setMessage("Publishing countdown schedule...");
    try {
      const submittedHosts = hostNames.map((host) => host.trim()).filter(Boolean);
      const response = await fetch("/api/owner/countdown/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventName,
          presenterName,
          eventLocation,
          livestreamAvailability,
          hostNames: submittedHosts,
          targetDateTime: parsedIso,
          schedule_timezone: timezone,
        }),
      });
      const data = (await response.json()) as ShowSetupResponse;
      if (!response.ok || !data.state) throw new Error(data.error ?? "Unable to save countdown schedule.");

      const persistedTime = new Date(data.state.targetDateTime).getTime();
      const requestedTime = new Date(parsedIso).getTime();
      const verified =
        data.state.showTitle === eventName.trim() &&
        persistedTime === requestedTime &&
        (!presenterName.trim() || data.state.presenterName === presenterName.trim()) &&
        (!eventLocation.trim() || data.state.eventLocation === eventLocation.trim()) &&
        (!livestreamAvailability.trim() ||
          data.state.livestreamAvailability === livestreamAvailability.trim()) &&
        submittedHosts.every((host) => data.state?.hostNames.includes(host));
      if (!verified) {
        throw new Error("The countdown response did not match the submitted schedule. Nothing was assumed saved.");
      }

      setEventName(data.state.showTitle);
      setPresenterName(data.state.presenterName);
      setEventLocation(data.state.eventLocation);
      setLivestreamAvailability(data.state.livestreamAvailability);
      setHostNames(normalizeHostInputs(data.state.hostNames));
      setDateTimeLocal(isoToScheduleDatetimeLocal(data.state.targetDateTime, timezone));
      setTone("success");
      setMessage("Countdown schedule saved, verified, and published across the app.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Countdown schedule failed to save.");
    } finally {
      setPending(false);
    }
  }, [
    dateTimeLocal,
    eventLocation,
    eventName,
    hostNames,
    livestreamAvailability,
    pending,
    presenterName,
    timezone,
  ]);

  const adjustTimer = useCallback(
    async (offsetSeconds: number) => {
      if (pending) return;
      setPending(true);
      setTone("info");
      setMessage("Adjusting countdown...");
      try {
        const response = await fetch("/api/owner/countdown", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offsetSeconds }),
        });
        const data = (await response.json()) as CountdownResponse;
        if (!response.ok) throw new Error(data.error ?? "Countdown adjustment failed.");
        setTone("success");
        setMessage(data.message ?? "Countdown adjusted.");
      } catch (error) {
        setTone("error");
        setMessage(error instanceof Error ? error.message : "Countdown adjustment failed.");
      } finally {
        setPending(false);
      }
    },
    [pending],
  );

  const clearEditor = () => {
    setEventName("");
    setPresenterName("");
    setEventLocation("");
    setLivestreamAvailability("");
    setHostNames([""]);
    setDateTimeLocal("");
    setTone("info");
    setMessage("Editor cleared. The currently published countdown was not changed.");
  };

  const copyOverlay = async () => {
    const url = `${window.location.origin}/countdown/obs`;
    await navigator.clipboard.writeText(url);
    setTone("success");
    setMessage("OBS/Restream countdown overlay URL copied.");
  };

  const simulatedConfig = useMemo<EventCountdownConfig>(() => {
    return {
      ...DEFAULT_COUNTDOWN_CONFIG,
      headline: eventName.trim() || DEFAULT_COUNTDOWN_CONFIG.headline,
      subtitle: presenterName.trim() || DEFAULT_COUNTDOWN_CONFIG.subtitle,
      start_time: targetIso,
      end_time: buildPreviewEndIso(targetIso),
      schedule_timezone: timezone,
    };
  }, [eventName, presenterName, targetIso, timezone]);

  return (
    <main className="min-h-dvh overflow-x-hidden overflow-y-auto bg-[#020203] bg-[radial-gradient(circle_at_22%_0%,rgba(0,168,255,0.13),transparent_28%),radial-gradient(circle_at_78%_4%,rgba(255,47,175,0.15),transparent_30%),linear-gradient(180deg,#050507_0%,#030611_54%,#010102_100%)] px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 text-white">
      <div className="mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-[112rem] gap-2 xl:grid-cols-[12rem_minmax(0,1fr)]">
        <OwnerProductionSideMenu active="countdown" />

        <div className="min-w-0 rounded-[6px] border border-white/10 bg-[#050814]/80 p-4 shadow-[0_0_28px_rgba(0,168,255,0.08)] sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="font-ui text-[0.58rem] font-black uppercase tracking-[0.18em] text-[#00DDEB]">
              Production Schedule
            </p>
            <h1 className="mt-2 font-headline text-3xl uppercase tracking-[0.08em] sm:text-4xl">Countdown Control</h1>
            <p className="mt-2 font-body text-sm text-white/55">One schedule for the app, attendee lobby, OBS, and Restream.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/countdown" target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 font-ui text-xs uppercase">
              Public Preview <ExternalLink className="h-4 w-4" />
            </Link>
            <button type="button" onClick={() => void copyOverlay()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#00DDEB]/45 px-4 font-ui text-xs uppercase text-[#00DDEB]">
              Overlay URL <Copy className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-[#D853FF]/45 bg-[#09091A]/90 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-ui text-xs uppercase tracking-[0.18em] text-[#D853FF]">Event schedule</p>
                <h2 className="mt-2 font-headline text-2xl uppercase">Published everywhere</h2>
              </div>
              <Clock3 className="h-8 w-8 text-[#00DDEB]" />
            </div>

            <label className="mt-6 block">
              <span className="font-ui text-xs uppercase tracking-[0.14em] text-white/60">Event name</span>
              <input value={eventName} onChange={(event) => setEventName(event.target.value)} disabled={loading || pending} className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#050816] px-4 font-body text-white outline-none focus:border-[#00DDEB]" />
            </label>
            <label className="mt-4 block">
              <span className="font-ui text-xs uppercase tracking-[0.14em] text-white/60">Artist / presenter</span>
              <input value={presenterName} onChange={(event) => setPresenterName(event.target.value)} disabled={loading || pending} className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#050816] px-4 font-body text-white outline-none focus:border-[#00DDEB]" />
            </label>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="font-ui text-xs uppercase tracking-[0.14em] text-white/60">Event location</span>
                <input
                  value={eventLocation}
                  onChange={(event) => setEventLocation(event.target.value)}
                  disabled={loading || pending}
                  maxLength={100}
                  className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#050816] px-4 font-body text-white outline-none focus:border-[#00DDEB]"
                />
              </label>
              <label>
                <span className="font-ui text-xs uppercase tracking-[0.14em] text-white/60">Livestream line</span>
                <input
                  value={livestreamAvailability}
                  onChange={(event) => setLivestreamAvailability(event.target.value)}
                  disabled={loading || pending}
                  maxLength={100}
                  className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#050816] px-4 font-body text-white outline-none focus:border-[#00DDEB]"
                />
              </label>
            </div>
            <fieldset className="mt-4">
              <legend className="sr-only">Event host names</legend>
              <div className="flex items-center justify-between gap-3">
                <span className="font-ui text-xs uppercase tracking-[0.14em] text-white/60">
                  Event host names
                </span>
                <button
                  type="button"
                  disabled={loading || pending || hostNames.length >= 8}
                  onClick={() => setHostNames((current) => [...current, ""])}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#00DDEB]/35 px-3 font-ui text-[0.62rem] uppercase text-[#00DDEB] disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Host
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {hostNames.map((hostName, index) => (
                  <div key={`host-${index}`} className="flex gap-2">
                    <input
                      aria-label={`Host ${index + 1} name`}
                      value={hostName}
                      onChange={(event) =>
                        setHostNames((current) =>
                          current.map((host, hostIndex) =>
                            hostIndex === index ? event.target.value : host,
                          ),
                        )
                      }
                      disabled={loading || pending}
                      maxLength={80}
                      className="min-h-12 min-w-0 flex-1 rounded-lg border border-white/15 bg-[#050816] px-4 font-body text-white outline-none focus:border-[#00DDEB]"
                    />
                    {hostNames.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`Remove host ${index + 1}`}
                        disabled={loading || pending}
                        onClick={() =>
                          setHostNames((current) => current.filter((_, hostIndex) => hostIndex !== index))
                        }
                        className="flex w-12 items-center justify-center rounded-lg border border-red-400/25 text-red-300 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-2 font-body text-xs text-white/35">Add up to eight hosts. Empty rows are ignored when saved.</p>
            </fieldset>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_0.8fr]">
              <label>
                <span className="font-ui text-xs uppercase tracking-[0.14em] text-white/60">Date and time</span>
                <input type="datetime-local" value={dateTimeLocal} onChange={(event) => setDateTimeLocal(event.target.value)} disabled={loading || pending} className="mt-2 min-h-12 w-full rounded-lg border border-white/15 bg-[#050816] px-4 font-body text-white outline-none focus:border-[#00DDEB]" />
              </label>
              <div>
                <span className="font-ui text-xs uppercase tracking-[0.14em] text-white/60">Timezone</span>
                <div className="mt-2 flex min-h-12 w-full items-center rounded-lg border border-white/15 bg-[#050816] px-4 font-body text-white/75">
                  Central Time (CT)
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              {[-300, -60, 60, 300].map((offset) => (
                <button key={offset} type="button" disabled={loading || pending} onClick={() => void adjustTimer(offset)} className="min-h-10 rounded-lg border border-white/15 font-ui text-[0.65rem] uppercase text-white/75 disabled:opacity-40">
                  {offset > 0 ? "+" : ""}{offset / 60} min
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={loading || pending} onClick={() => void saveSchedule()} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#D80A86] via-[#7B3DFF] to-[#00A7FF] px-5 font-ui text-xs uppercase tracking-[0.14em] disabled:opacity-45">
                <Save className="h-4 w-4" /> {pending ? "Saving..." : "Save & Publish"}
              </button>
              <button type="button" disabled={pending} onClick={clearEditor} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/15 px-4 font-ui text-xs uppercase text-white/65">
                <RotateCcw className="h-4 w-4" /> Clear
              </button>
            </div>
            <p className={`mt-4 flex items-center gap-2 font-body text-sm ${tone === "error" ? "text-red-300" : tone === "success" ? "text-emerald-300" : "text-white/55"}`}>
              {tone === "success" ? <Check className="h-4 w-4" /> : null}{message}
            </p>
          </section>

          {/* DYNAMIC PUBLIC ATTENDEE HOLDING ROOM COMPOSITE ARTBOARD PREVIEW PANEL */}
          <section className="overflow-hidden rounded-2xl border border-[#00DDEB]/35 bg-black flex items-center justify-center p-4">
            <div className="live-holding-shell bg-black text-white w-full flex justify-center">
              <div className={`${MOBILE_ARTBOARD_FULL_SHELL} border border-white/10 rounded-xl overflow-hidden shadow-2xl`}>
                <div
                  className="holding-room-page__stage"
                  style={
                    mobileArtboardStageStyle({ native: HOLDING_ROOM_ART_NATIVE }) as CSSProperties
                  }
                >
                  <div className="mobile-artboard-art-fit holding-room-page__art-fit">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/holding-room/holding-room.png"
                      alt={`${PLATFORM_APP_NAME} holding room preview`}
                      width={HOLDING_ROOM_ART_NATIVE.width}
                      height={HOLDING_ROOM_ART_NATIVE.height}
                      className="holding-room-page__bg"
                      loading="eager"
                      draggable={false}
                    />

                    <div className="absolute inset-0">
                      {previewReady ? (
                        <HoldingRoomCountdownOverlay initialCountdownConfig={simulatedConfig} />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>
    </main>
  );
}
