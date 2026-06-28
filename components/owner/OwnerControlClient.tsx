"use client";

import { useCallback, useEffect, useState } from "react";
import BroadcastControlWizard from "@/components/owner/BroadcastControlWizard";
import type { SelectedCaptureDevices } from "@/components/owner/InAppDeviceCaptureSelectors";
import type { OwnerBroadcastSnapshot, OwnerPublisherSession } from "@/lib/owner/contracts";
import { derivePendingTodos, hasBlockingTodos } from "@/lib/owner/derive-pending-todos";
import { useOwnerBroadcastSnapshot } from "@/hooks/useOwnerBroadcastSnapshot";

type BroadcastResponse = {
  snapshot?: OwnerBroadcastSnapshot;
  error?: string;
  message?: string;
  ok?: boolean;
  blocked?: boolean;
};

type IngestCredentialsResponse = {
  credentials?: {
    rtmpUrl: string | null;
    streamKey: string | null;
    detail: string | null;
  };
};

export default function OwnerControlClient() {
  const { snapshot, loading, error, reload, setSnapshot } = useOwnerBroadcastSnapshot();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(true);
  const [ingestCredentials, setIngestCredentials] = useState<{
    rtmpUrl: string | null;
    streamKey: string | null;
    detail: string | null;
  }>({ rtmpUrl: null, streamKey: null, detail: null });
  const [publisherSession, setPublisherSession] = useState<OwnerPublisherSession | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<SelectedCaptureDevices>({
    videoDeviceId: "",
    audioDeviceId: "",
  });

  const pendingTodos = derivePendingTodos(snapshot.preflight);
  const hasPendingTasks = pendingTodos.length > 0 || hasBlockingTodos(snapshot.preflight);

  const loadIngestCredentials = useCallback(async () => {
    setIngestLoading(true);
    try {
      const response = await fetch("/api/owner/ingest/credentials", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Unable to load ingest credentials.");
      }
      const data = (await response.json()) as IngestCredentialsResponse;
      if (data.credentials) {
        setIngestCredentials({
          rtmpUrl: data.credentials.rtmpUrl,
          streamKey: data.credentials.streamKey,
          detail: data.credentials.detail,
        });
      }
    } catch (loadError) {
      setIngestCredentials({
        rtmpUrl: null,
        streamKey: null,
        detail:
          loadError instanceof Error ? loadError.message : "Ingest credentials unavailable.",
      });
    } finally {
      setIngestLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIngestCredentials();
  }, [loadIngestCredentials]);

  const runGoLive = useCallback(
    async (mode: "rtmp_encoder" | "browser_camera") => {
      setActionPending(true);
      setActionMessage(null);
      try {
        const response = await fetch("/api/owner/broadcast/go-live", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, confirm: true }),
        });
        const data = (await response.json()) as BroadcastResponse;
        if (data.snapshot) setSnapshot(data.snapshot);
        setActionMessage(data.message ?? (data.ok ? "Go-live succeeded." : "Go-live blocked."));
        return data.ok === true;
      } catch {
        setActionMessage("Go-live request failed.");
        return false;
      } finally {
        setActionPending(false);
      }
    },
    [setSnapshot],
  );

  const handleStartExternalBroadcast = useCallback(async () => {
    if (hasBlockingTodos(snapshot.preflight)) {
      setActionMessage("Resolve failing preflight checks before starting external broadcast.");
      return;
    }

    setActionPending(true);
    setActionMessage(null);
    try {
      const preflightResponse = await fetch("/api/owner/broadcast/preflight", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rtmp_encoder" }),
      });
      const preflightData = (await preflightResponse.json()) as BroadcastResponse;
      if (preflightData.snapshot) setSnapshot(preflightData.snapshot);

      if (preflightData.blocked) {
        setActionMessage("Preflight blockers detected - review Pre-Show checklist.");
        return;
      }

      await runGoLive("rtmp_encoder");
    } catch {
      setActionMessage("External broadcast activation failed.");
    } finally {
      setActionPending(false);
    }
  }, [runGoLive, setSnapshot, snapshot.preflight]);

  const handleLaunchInAppCamera = useCallback(async () => {
    if (hasBlockingTodos(snapshot.preflight)) {
      setActionMessage("Resolve failing preflight checks before launching in-app camera.");
      return;
    }

    setActionPending(true);
    setActionMessage(null);
    try {
      const sessionResponse = await fetch("/api/owner/publisher/session", {
        method: "POST",
        credentials: "include",
      });
      const sessionData = (await sessionResponse.json()) as {
        session?: OwnerPublisherSession;
        error?: string;
      };

      if (!sessionResponse.ok || !sessionData.session) {
        setActionMessage(sessionData.error ?? "Unable to create publisher session.");
        return;
      }

      setPublisherSession(sessionData.session);
      await reload(true);

      const preflightResponse = await fetch("/api/owner/broadcast/preflight", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "browser_camera" }),
      });
      const preflightData = (await preflightResponse.json()) as BroadcastResponse;
      if (preflightData.snapshot) setSnapshot(preflightData.snapshot);

      const liveOk = await runGoLive("browser_camera");
      if (!liveOk) {
        setPublisherSession(null);
      }
    } catch {
      setActionMessage("In-app camera launch failed.");
      setPublisherSession(null);
    } finally {
      setActionPending(false);
    }
  }, [reload, runGoLive, setSnapshot, snapshot.preflight]);

  const handleDropCurtain = useCallback(async (): Promise<boolean> => {
    setActionMessage(null);
    try {
      const response = await fetch("/api/owner/broadcast/instant-override", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const data = (await response.json()) as BroadcastResponse;

      if (!response.ok) {
        const failureMessage =
          data.message ?? data.error ?? `Drop curtain failed (HTTP ${response.status}).`;
        setActionMessage(failureMessage);
        return false;
      }

      if (data.snapshot) setSnapshot(data.snapshot);

      if (data.ok === false) {
        const failureMessage = data.message ?? data.error ?? "Instant override failed.";
        setActionMessage(failureMessage);
        return false;
      }

      setActionMessage(
        data.message ??
          "Drop curtain active - attendees notified for imminent live transition.",
      );
      return true;
    } catch {
      const failureMessage = "Drop curtain request failed.";
      setActionMessage(failureMessage);
      return false;
    }
  }, [setSnapshot]);

  const handleEndBroadcast = useCallback(async () => {
    setActionPending(true);
    setActionMessage(null);
    try {
      if (publisherSession) {
        await fetch("/api/owner/publisher/session", {
          method: "DELETE",
          credentials: "include",
        });
        setPublisherSession(null);
      }

      const response = await fetch("/api/owner/broadcast/end", {
        method: "POST",
        credentials: "include",
      });
      const data = (await response.json()) as BroadcastResponse;
      if (data.snapshot) setSnapshot(data.snapshot);
      setActionMessage(data.message ?? (data.ok ? "Broadcast ended." : "End blocked."));
    } catch {
      setActionMessage("End broadcast request failed.");
    } finally {
      setActionPending(false);
    }
  }, [publisherSession, setSnapshot]);

  const handleRefresh = useCallback(() => {
    void reload();
  }, [reload]);

  return (
    <BroadcastControlWizard
      snapshot={snapshot}
      loading={loading}
      error={error}
      actionMessage={actionMessage}
      actionPending={actionPending}
      hasPendingTasks={hasPendingTasks}
      ingestCredentials={{ ...ingestCredentials, loading: ingestLoading }}
      publisherSession={publisherSession}
      selectedDevices={selectedDevices}
      onDevicesChange={setSelectedDevices}
      onStartExternalBroadcast={handleStartExternalBroadcast}
      onLaunchInAppCamera={handleLaunchInAppCamera}
      onDropCurtain={handleDropCurtain}
      onEndBroadcast={handleEndBroadcast}
      onRefresh={handleRefresh}
    />
  );
}
