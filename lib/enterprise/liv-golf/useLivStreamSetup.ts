"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLivStreamStatus } from "@/app/enterprise/liv-golf/hooks/useLivStreamStatus";
import { canAttemptLivGoLive } from "@/lib/enterprise/liv-golf/check-stream-readiness";
import { sanitizeLivShowSetupFields } from "@/lib/enterprise/liv-golf/sanitize-liv-show-setup";
import type { EncoderHealthStatus } from "@/lib/owner/encoder-health";
import type { OwnerBroadcastSnapshot, PreflightCheck } from "@/lib/owner/contracts";
import { getClientAppUrl } from "@/lib/client-api";
import { HLS_PLAYBACK_REQUIREMENT, isValidHlsUrl } from "@/lib/live/hls";
import {
  DEFAULT_SCHEDULE_TIMEZONE,
  isoToScheduleDatetimeLocal,
  scheduleDatetimeLocalToIso,
  type ScheduleTimezone,
} from "@/lib/live/schedule-timezone";
import type { RestreamEncoderFields } from "@/components/owner/RestreamEncoderPanel";

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

type EncoderHealthResponse = {
  ok?: boolean;
  status?: EncoderHealthStatus;
  detail?: string | null;
  error?: string;
};

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
  const {
    status: streamReadiness,
    refresh: refreshStreamStatus,
    isRealtimeConnected,
  } = useLivStreamStatus({ mountPlayerDuringStateSync: false });

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

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const snapshotInFlightRef = useRef(false);

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

  const applyBroadcastSnapshot = useCallback((next: OwnerBroadcastSnapshot) => {
    setSnapshot(next);
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

  const refreshPipeline = useCallback(async () => {
    await Promise.all([loadSnapshot(), refreshStreamStatus()]);
  }, [loadSnapshot, refreshStreamStatus]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await Promise.all([loadShowSetup(), loadSnapshot(), loadEncoderHealth()]);
      } catch (error) {
        if (!cancelled) {
          setSaveError(error instanceof Error ? error.message : "Unable to load stream setup.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();

    const encoderInterval = window.setInterval(() => void loadEncoderHealth(), ENCODER_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(encoderInterval);
    };
  }, [loadEncoderHealth, loadShowSetup, loadSnapshot]);

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
      await refreshPipeline();
      await loadEncoderHealth();
      return true;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save encoder config.");
      return false;
    } finally {
      setEncoderSaving(false);
    }
  }, [applyShowSetup, encoderFields, encoderSaving, loadEncoderHealth, refreshPipeline]);

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
      await refreshPipeline();
      const phaseLabel = streamReadiness?.eventPhase ?? "updated";
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
    metadataSaving,
    refreshPipeline,
    scheduleTimezone,
    showTitle,
    streamReadiness?.eventPhase,
    targetDateTime,
  ]);

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
    isRealtimeConnected,
    isLoading,
    encoderSaving,
    metadataSaving,
    saveMessage,
    saveError,
    actionMessage,
    saveEncoder,
    saveMetadata,
    applyBroadcastSnapshot,
    refreshPipeline,
    setActionMessage,
    refresh: refreshPipeline,
  };
}
