"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import {
  canAttemptLivGoLive,
  fetchLivStreamReadiness,
  formatLivReadinessError,
} from "@/lib/enterprise/liv-golf/check-stream-readiness";
import { sanitizeLivShowSetupFields } from "@/lib/enterprise/liv-golf/sanitize-liv-show-setup";
import type { LivStreamSetupStatus } from "@/lib/enterprise/liv-golf/liv-stream-setup-status";
import type { EncoderHealthStatus } from "@/lib/owner/encoder-health";
import type { OwnerBroadcastSnapshot, PreflightCheck } from "@/lib/owner/contracts";
import { HLS_PLAYBACK_REQUIREMENT, isValidHlsUrl } from "@/lib/live/hls";
import {
  DEFAULT_SCHEDULE_TIMEZONE,
  isoToScheduleDatetimeLocal,
  scheduleDatetimeLocalToIso,
  type ScheduleTimezone,
} from "@/lib/live/schedule-timezone";
import type { RestreamEncoderFields } from "@/components/owner/RestreamEncoderPanel";

const SNAPSHOT_POLL_MS = 5_000;
const ENCODER_POLL_MS = 10_000;

type ShowSetupStatePayload = {
  showTitle?: string;
  presenterName?: string;
  eventLocation?: string;
  targetDateTime?: string;
  scheduleTimezone?: ScheduleTimezone;
  primaryIngestEndpoint?: string;
  streamKey?: string;
  attendeePlaybackHlsUrl?: string;
  updatedAt?: string | null;
};

type ShowSetupResponse = {
  ok?: boolean;
  state?: ShowSetupStatePayload;
  message?: string;
  error?: string;
};

type BroadcastResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  snapshot?: OwnerBroadcastSnapshot;
  blocked?: boolean;
};

type EncoderHealthResponse = {
  ok?: boolean;
  status?: EncoderHealthStatus;
  detail?: string | null;
  error?: string;
};

type BroadcastAction = "idle" | "go-live" | "stop";

const EMPTY_ENCODER_FIELDS: RestreamEncoderFields = {
  primaryIngestEndpoint: "",
  streamKey: "",
  attendeePlaybackHlsUrl: "",
};

const LIV_EMPTY_SHOW_TITLE = "";

function parseApiError(
  response: Response,
  json: { error?: string; message?: string },
  fallback: string,
): string {
  return json.error || json.message || `${fallback} (HTTP ${response.status}).`;
}

export function useLivStreamSetup() {
  const [showTitle, setShowTitle] = useState(LIV_EMPTY_SHOW_TITLE);
  const [eventLocation, setEventLocation] = useState("");
  const [targetDateTime, setTargetDateTime] = useState("");
  const [scheduleTimezone, setScheduleTimezone] =
    useState<ScheduleTimezone>(DEFAULT_SCHEDULE_TIMEZONE);
  const [encoderFields, setEncoderFields] = useState<RestreamEncoderFields>(EMPTY_ENCODER_FIELDS);
  const [encoderLastSavedAt, setEncoderLastSavedAt] = useState<string | null>(null);

  const [snapshot, setSnapshot] = useState<OwnerBroadcastSnapshot | null>(null);
  const [encoderHealth, setEncoderHealth] = useState<EncoderHealthStatus | "checking">("checking");
  const [encoderHealthDetail, setEncoderHealthDetail] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [encoderSaving, setEncoderSaving] = useState(false);
  const [metadataSaving, setMetadataSaving] = useState(false);
  const [broadcastAction, setBroadcastAction] = useState<BroadcastAction>("idle");
  const [preflightRunning, setPreflightRunning] = useState(false);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [streamReadiness, setStreamReadiness] = useState<LivStreamSetupStatus | null>(null);

  const snapshotInFlightRef = useRef(false);
  const goLiveInFlightRef = useRef(false);
  const stopInFlightRef = useRef(false);

  const applyShowSetup = useCallback((state: ShowSetupStatePayload) => {
    const sanitized = sanitizeLivShowSetupFields(state);
    const timezone = sanitized.scheduleTimezone ?? DEFAULT_SCHEDULE_TIMEZONE;
    setShowTitle(sanitized.showTitle?.trim() || LIV_EMPTY_SHOW_TITLE);
    setEventLocation(sanitized.eventLocation?.trim() || "");
    setScheduleTimezone(timezone);
    setTargetDateTime(
      sanitized.targetDateTime
        ? isoToScheduleDatetimeLocal(sanitized.targetDateTime, timezone)
        : "",
    );
    setEncoderFields({
      primaryIngestEndpoint: sanitized.primaryIngestEndpoint ?? "",
      streamKey: sanitized.streamKey ?? "",
      attendeePlaybackHlsUrl: sanitized.attendeePlaybackHlsUrl ?? "",
    });
    setEncoderLastSavedAt(sanitized.updatedAt ?? null);
  }, []);

  const loadStreamReadiness = useCallback(async () => {
    try {
      const status = await fetchLivStreamReadiness(getClientAppUrl());
      setStreamReadiness(status);
      return status;
    } catch {
      setStreamReadiness(null);
      return null;
    }
  }, []);

  const loadShowSetup = useCallback(async () => {
    const response = await fetch(`${getClientAppUrl()}/api/owner/show-setup`, {
      credentials: "include",
      cache: "no-store",
    });
    const json = (await response.json()) as ShowSetupResponse;

    if (!response.ok || !json.state) {
      throw new Error(parseApiError(response, json, "Unable to load show setup"));
    }

    applyShowSetup(json.state);
  }, [applyShowSetup]);

  const loadSnapshot = useCallback(async () => {
    if (snapshotInFlightRef.current) return;
    snapshotInFlightRef.current = true;

    try {
      const response = await fetch(`${getClientAppUrl()}/api/owner/broadcast`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return;

      const json = (await response.json()) as { snapshot?: OwnerBroadcastSnapshot };
      if (json.snapshot) setSnapshot(json.snapshot);
    } finally {
      snapshotInFlightRef.current = false;
    }
  }, []);

  const loadEncoderHealth = useCallback(async () => {
    try {
      const response = await fetch(`${getClientAppUrl()}/api/owner/encoder-health`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = (await response.json()) as EncoderHealthResponse;

      if (!response.ok || json.ok === false) {
        setEncoderHealth("offline");
        setEncoderHealthDetail(json.error ?? "Encoder health unavailable.");
        return;
      }

      setEncoderHealth(json.status ?? "unconfigured");
      setEncoderHealthDetail(json.detail ?? null);
    } catch {
      setEncoderHealth("offline");
      setEncoderHealthDetail("Encoder health unavailable.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await Promise.all([loadShowSetup(), loadSnapshot(), loadEncoderHealth(), loadStreamReadiness()]);
      } catch (error) {
        if (!cancelled) {
          setSaveError(error instanceof Error ? error.message : "Unable to load stream setup.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();

    const snapshotInterval = window.setInterval(() => void loadSnapshot(), SNAPSHOT_POLL_MS);
    const encoderInterval = window.setInterval(() => void loadEncoderHealth(), ENCODER_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(snapshotInterval);
      window.clearInterval(encoderInterval);
    };
  }, [loadEncoderHealth, loadShowSetup, loadSnapshot, loadStreamReadiness]);

  const saveEncoder = useCallback(async () => {
    if (encoderSaving) return false;

    const playbackUrl = encoderFields.attendeePlaybackHlsUrl.trim();
    if (playbackUrl && !isValidHlsUrl(playbackUrl)) {
      setSaveError(HLS_PLAYBACK_REQUIREMENT);
      return false;
    }

    setEncoderSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await fetch(`${getClientAppUrl()}/api/owner/show-setup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encoderFields),
      });
      const json = (await response.json()) as ShowSetupResponse;

      if (!response.ok || !json.state) {
        throw new Error(parseApiError(response, json, "Unable to save encoder config"));
      }

      applyShowSetup(json.state);
      setSaveMessage(json.message ?? "Encoder credentials saved.");
      await loadSnapshot();
      await loadEncoderHealth();
      await loadStreamReadiness();
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save encoder config.");
      return false;
    } finally {
      setEncoderSaving(false);
    }
  }, [applyShowSetup, encoderFields, encoderSaving, loadEncoderHealth, loadSnapshot, loadStreamReadiness]);

  const setAirTimeOneHourFromNow = useCallback(() => {
    const next = new Date(Date.now() + 60 * 60 * 1000);
    setTargetDateTime(isoToScheduleDatetimeLocal(next.toISOString(), scheduleTimezone));
  }, [scheduleTimezone]);

  const saveMetadata = useCallback(async () => {
    if (metadataSaving) return false;

    setMetadataSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const targetIso = targetDateTime.trim()
        ? scheduleDatetimeLocalToIso(targetDateTime, scheduleTimezone)
        : null;

      if (targetDateTime.trim() && !targetIso) {
        throw new Error("Target air time must use a valid date and time.");
      }

      const response = await fetch(`${getClientAppUrl()}/api/owner/show-setup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showTitle,
          eventLocation,
          targetDateTime: targetIso ?? undefined,
          scheduleTimezone,
        }),
      });
      const json = (await response.json()) as ShowSetupResponse;

      if (!response.ok || !json.state) {
        throw new Error(parseApiError(response, json, "Unable to save event metadata"));
      }

      applyShowSetup(json.state);
      await loadSnapshot();
      const readiness = await loadStreamReadiness();
      const phaseLabel = readiness?.eventPhase ?? "updated";
      setSaveMessage(
        json.message
          ? `${json.message} Event phase: ${phaseLabel}.`
          : `Event metadata saved. Event phase: ${phaseLabel}.`,
      );
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save event metadata.");
      return false;
    } finally {
      setMetadataSaving(false);
    }
  }, [
    applyShowSetup,
    eventLocation,
    loadSnapshot,
    loadStreamReadiness,
    metadataSaving,
    scheduleTimezone,
    showTitle,
    targetDateTime,
  ]);

  const runPreflight = useCallback(async () => {
    setPreflightRunning(true);
    setActionError(null);
    setActionMessage("Running preflight checks...");

    try {
      const response = await fetch(`${getClientAppUrl()}/api/owner/broadcast/preflight`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "external_hls" }),
      });
      const json = (await response.json()) as BroadcastResponse;

      if (!response.ok) {
        throw new Error(parseApiError(response, json, "Preflight failed"));
      }

      if (json.snapshot) setSnapshot(json.snapshot);
      await loadStreamReadiness();

      setActionMessage(
        json.blocked
          ? "Preflight found blocking issues — resolve before go-live."
          : "Preflight complete — ready for go-live.",
      );
      return !json.blocked;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Preflight failed.");
      setActionMessage(null);
      return false;
    } finally {
      setPreflightRunning(false);
    }
  }, [loadStreamReadiness]);

  const goLive = useCallback(async () => {
    if (goLiveInFlightRef.current || broadcastAction !== "idle") return false;
    goLiveInFlightRef.current = true;
    setBroadcastAction("go-live");
    setActionError(null);
    setActionMessage("Sending go-live command...");

    try {
      const readiness = (await loadStreamReadiness()) ?? streamReadiness;
      if (readiness && !canAttemptLivGoLive(readiness)) {
        throw new Error(`Stream cannot launch: ${formatLivReadinessError(readiness)}`);
      }

      const response = await fetch(`${getClientAppUrl()}/api/owner/master-go-live`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "external_hls", confirm: true, masterOverride: true }),
      });
      const json = (await response.json()) as BroadcastResponse & { state?: ShowSetupStatePayload };

      if (!response.ok || json.ok === false) {
        throw new Error(parseApiError(response, json, "Go-live failed"));
      }

      if (json.snapshot) setSnapshot(json.snapshot);
      if (json.state) applyShowSetup(json.state);
      await loadSnapshot();
      await loadStreamReadiness();

      setActionMessage(json.message ?? "Stream is live on platform.");
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Go-live failed.");
      setActionMessage(null);
      return false;
    } finally {
      goLiveInFlightRef.current = false;
      setBroadcastAction("idle");
    }
  }, [applyShowSetup, broadcastAction, loadSnapshot, loadStreamReadiness, streamReadiness]);

  const stopStream = useCallback(async () => {
    if (stopInFlightRef.current || broadcastAction !== "idle") return false;
    if (snapshot?.publish.status !== "publishing") return false;

    stopInFlightRef.current = true;
    setBroadcastAction("stop");
    setActionError(null);
    setActionMessage("Stopping broadcast...");

    try {
      const response = await fetch(`${getClientAppUrl()}/api/owner/broadcast-end`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await response.json()) as BroadcastResponse;

      if (!response.ok || json.ok === false) {
        throw new Error(parseApiError(response, json, "Stop broadcast failed"));
      }

      if (json.snapshot) setSnapshot(json.snapshot);
      else await loadSnapshot();

      setActionMessage(json.message ?? "Broadcast ended.");
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Stop broadcast failed.");
      setActionMessage(null);
      return false;
    } finally {
      stopInFlightRef.current = false;
      setBroadcastAction("idle");
    }
  }, [broadcastAction, loadSnapshot, snapshot?.publish.status]);

  const isLive = snapshot?.publish.status === "publishing";
  const preflight: PreflightCheck[] = snapshot?.preflight ?? [];
  const hlsUrl = snapshot?.playback.hlsUrl ?? snapshot?.feed.primary.hlsUrl ?? null;
  const manifestReachable =
    streamReadiness?.manifestReachable ??
    snapshot?.playback.manifestReachable ??
    snapshot?.feed.primary.manifestReachable ??
    false;
  const canAttemptGoLive = canAttemptLivGoLive(streamReadiness);

  return {
    showTitle,
    setShowTitle,
    eventLocation,
    setEventLocation,
    targetDateTime,
    setTargetDateTime,
    setAirTimeOneHourFromNow,
    scheduleTimezone,
    encoderFields,
    setEncoderFields,
    encoderLastSavedAt,
    encoderHealth,
    encoderHealthDetail,
    snapshot,
    isLive,
    preflight,
    hlsUrl,
    manifestReachable,
    streamReadiness,
    canAttemptGoLive,
    isLoading,
    encoderSaving,
    metadataSaving,
    broadcastAction,
    preflightRunning,
    saveMessage,
    saveError,
    actionMessage,
    actionError,
    saveEncoder,
    saveMetadata,
    runPreflight,
    goLive,
    stopStream,
    refresh: async () => {
      await loadSnapshot();
      await loadStreamReadiness();
    },
  };
}
