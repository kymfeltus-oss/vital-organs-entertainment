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
    source?: "env" | "unconfigured";
    detail: string | null;
  };
};

type OperationStatus = "idle" | "pending" | "success" | "blocked" | "error";
type OperationCommand = "external" | "camera" | "dropCurtain" | "end" | null;

type OperationReceipt = {
  status: OperationStatus;
  command: OperationCommand;
  title: string;
  detail: string;
  timestamp: string | null;
};

const IDLE_OPERATION_RECEIPT: OperationReceipt = {
  status: "idle",
  command: null,
  title: "Ready",
  detail: "No broadcast command has been submitted yet.",
  timestamp: null,
};

async function parseBroadcastResponse(response: Response): Promise<BroadcastResponse> {
  try {
    return (await response.json()) as BroadcastResponse;
  } catch {
    return {
      ok: false,
      error: `Backend returned HTTP ${response.status} without a readable JSON response.`,
    };
  }
}

function receiptTimestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function OwnerControlClient() {
  const { snapshot, loading, error, reload, setSnapshot } = useOwnerBroadcastSnapshot();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [operationReceipt, setOperationReceipt] =
    useState<OperationReceipt>(IDLE_OPERATION_RECEIPT);
  const [actionPending, setActionPending] = useState(false);
  const [ingestLoading, setIngestLoading] = useState(true);
  const [ingestCredentials, setIngestCredentials] = useState<{
    rtmpUrl: string | null;
    streamKey: string | null;
    source: "env" | "unconfigured";
    detail: string | null;
  }>({ rtmpUrl: null, streamKey: null, source: "unconfigured", detail: null });
  const [publisherSession, setPublisherSession] = useState<OwnerPublisherSession | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<SelectedCaptureDevices>({
    videoDeviceId: "",
    audioDeviceId: "",
  });

  const pendingTodos = derivePendingTodos(snapshot.preflight);
  const hasPendingTasks = pendingTodos.length > 0 || hasBlockingTodos(snapshot.preflight);

  const updateOperationReceipt = useCallback(
    (status: OperationStatus, command: OperationCommand, title: string, detail: string) => {
      setOperationReceipt({
        status,
        command,
        title,
        detail,
        timestamp: status === "idle" ? null : receiptTimestamp(),
      });
      setActionMessage(detail);
    },
    [],
  );

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
          source: data.credentials.source ?? "unconfigured",
          detail: data.credentials.detail,
        });
      }
    } catch (loadError) {
      setIngestCredentials({
        rtmpUrl: null,
        streamKey: null,
        source: "unconfigured",
        detail:
          loadError instanceof Error ? loadError.message : "Ingest credentials unavailable.",
      });
    } finally {
      setIngestLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadIngestCredentials());
  }, [loadIngestCredentials]);

  const runGoLive = useCallback(
    async (mode: "rtmp_encoder" | "browser_camera", label: string, command: Exclude<OperationCommand, null>) => {
      setActionPending(true);
      updateOperationReceipt("pending", command, `${label} request sent`, "Waiting for backend go-live confirmation.");
      try {
        const response = await fetch("/api/owner/broadcast/go-live", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, confirm: true }),
        });
        const data = await parseBroadcastResponse(response);
        if (data.snapshot) setSnapshot(data.snapshot);
        if (!response.ok || data.ok !== true) {
          const detail =
            data.message ??
            data.error ??
            `Go-live did not complete. Backend returned HTTP ${response.status}.`;
          updateOperationReceipt(
            data.blocked || response.status === 409 ? "blocked" : "error",
            command,
            `${label} failed`,
            detail,
          );
          return false;
        }

        updateOperationReceipt(
          "success",
          command,
          `${label} confirmed`,
          data.message ?? "Backend accepted the go-live command and returned an updated broadcast snapshot.",
        );
        return true;
      } catch {
        updateOperationReceipt(
          "error",
          command,
          `${label} failed`,
          "Go-live request failed before the backend could confirm the command.",
        );
        return false;
      } finally {
        setActionPending(false);
      }
    },
    [setSnapshot, updateOperationReceipt],
  );

  const handleStartExternalBroadcast = useCallback(async () => {
    setActionPending(true);
    updateOperationReceipt(
      "pending",
      "external",
      "External broadcast preflight running",
      "Checking RTMP broadcast requirements before sending the go-live command.",
    );
    try {
      const preflightResponse = await fetch("/api/owner/broadcast/preflight", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rtmp_encoder" }),
      });
      const preflightData = await parseBroadcastResponse(preflightResponse);
      if (preflightData.snapshot) setSnapshot(preflightData.snapshot);

      if (!preflightResponse.ok) {
        updateOperationReceipt(
          "error",
          "external",
          "External broadcast preflight failed",
          preflightData.error ??
            preflightData.message ??
            `Preflight failed with HTTP ${preflightResponse.status}.`,
        );
        return;
      }

      if (preflightData.blocked === true) {
        updateOperationReceipt(
          "blocked",
          "external",
          "External broadcast blocked",
          preflightData.message ?? "Preflight blockers detected - review Pre-Show checklist.",
        );
        return;
      }

      await runGoLive("rtmp_encoder", "External broadcast", "external");
    } catch {
      updateOperationReceipt(
        "error",
        "external",
        "External broadcast failed",
        "External broadcast activation failed before backend confirmation.",
      );
    } finally {
      setActionPending(false);
    }
  }, [runGoLive, setSnapshot, updateOperationReceipt]);

  const handleLaunchInAppCamera = useCallback(async () => {
    setActionPending(true);
    updateOperationReceipt(
      "pending",
      "camera",
      "Camera stream session starting",
      "Creating a browser publisher session before requesting go-live.",
    );
    try {
      const sessionResponse = await fetch("/api/owner/publisher/session", {
        method: "POST",
        credentials: "include",
      });
      const sessionData = (await parseBroadcastResponse(sessionResponse)) as BroadcastResponse & {
        session?: OwnerPublisherSession;
      };

      if (!sessionResponse.ok || !sessionData.session) {
        updateOperationReceipt(
          "error",
          "camera",
          "Camera stream session failed",
          sessionData.error ??
            sessionData.message ??
            `Unable to create publisher session. Backend returned HTTP ${sessionResponse.status}.`,
        );
        return;
      }

      setPublisherSession(sessionData.session);
      updateOperationReceipt(
        "pending",
        "camera",
        "Camera stream session created",
        "Publisher session is ready. Running browser camera preflight now.",
      );
      await reload(true);

      const preflightResponse = await fetch("/api/owner/broadcast/preflight", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "browser_camera" }),
      });
      const preflightData = await parseBroadcastResponse(preflightResponse);
      if (preflightData.snapshot) setSnapshot(preflightData.snapshot);

      if (!preflightResponse.ok) {
        updateOperationReceipt(
          "error",
          "camera",
          "Camera stream preflight failed",
          preflightData.error ??
            preflightData.message ??
            `Preflight failed with HTTP ${preflightResponse.status}.`,
        );
        setPublisherSession(null);
        return;
      }

      if (preflightData.blocked === true) {
        updateOperationReceipt(
          "blocked",
          "camera",
          "Camera stream blocked",
          preflightData.message ?? "Preflight blockers detected - review Pre-Show checklist.",
        );
        setPublisherSession(null);
        return;
      }

      const liveOk = await runGoLive("browser_camera", "Camera stream", "camera");
      if (!liveOk) {
        setPublisherSession(null);
      }
    } catch {
      updateOperationReceipt(
        "error",
        "camera",
        "Camera stream failed",
        "In-app camera launch failed before backend confirmation.",
      );
      setPublisherSession(null);
    } finally {
      setActionPending(false);
    }
  }, [reload, runGoLive, setSnapshot, updateOperationReceipt]);

  const handleDropCurtain = useCallback(async (): Promise<boolean> => {
    updateOperationReceipt(
      "pending",
      "dropCurtain",
      "Drop Curtain request sent",
      "Opening attendee gates and waiting for backend confirmation.",
    );
    try {
      const response = await fetch("/api/owner/broadcast/instant-override", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const data = await parseBroadcastResponse(response);

      if (!response.ok) {
        const failureMessage =
          data.message ?? data.error ?? `Drop curtain failed (HTTP ${response.status}).`;
        updateOperationReceipt("error", "dropCurtain", "Drop Curtain failed", failureMessage);
        return false;
      }

      if (data.snapshot) setSnapshot(data.snapshot);

      if (data.ok === false) {
        const failureMessage = data.message ?? data.error ?? "Instant override failed.";
        updateOperationReceipt("blocked", "dropCurtain", "Drop Curtain blocked", failureMessage);
        return false;
      }

      updateOperationReceipt(
        "success",
        "dropCurtain",
        "Drop Curtain confirmed",
        data.message ?? "Drop curtain active - attendees notified for imminent live transition.",
      );
      return true;
    } catch {
      const failureMessage = "Drop curtain request failed.";
      updateOperationReceipt("error", "dropCurtain", "Drop Curtain failed", failureMessage);
      return false;
    }
  }, [setSnapshot, updateOperationReceipt]);

  const handleEndBroadcast = useCallback(async () => {
    setActionPending(true);
    updateOperationReceipt(
      "pending",
      "end",
      "End broadcast request sent",
      "Stopping active publisher paths and waiting for backend confirmation.",
    );
    try {
      if (publisherSession) {
        const publisherResponse = await fetch("/api/owner/publisher/session", {
          method: "DELETE",
          credentials: "include",
        });
        if (!publisherResponse.ok) {
          const publisherData = await parseBroadcastResponse(publisherResponse);
          updateOperationReceipt(
            "error",
            "end",
            "End broadcast failed",
            publisherData.error ??
              publisherData.message ??
              `Publisher session cleanup failed with HTTP ${publisherResponse.status}.`,
          );
          return;
        }
        setPublisherSession(null);
      }

      const response = await fetch("/api/owner/broadcast/end", {
        method: "POST",
        credentials: "include",
      });
      const data = await parseBroadcastResponse(response);
      if (data.snapshot) setSnapshot(data.snapshot);
      if (!response.ok || data.ok !== true) {
        updateOperationReceipt(
          data.blocked || response.status === 409 ? "blocked" : "error",
          "end",
          "End broadcast failed",
          data.message ?? data.error ?? `End request failed with HTTP ${response.status}.`,
        );
        return;
      }
      updateOperationReceipt(
        "success",
        "end",
        "Broadcast ended",
        data.message ?? "Broadcast ended and backend returned an updated snapshot.",
      );
    } catch {
      updateOperationReceipt(
        "error",
        "end",
        "End broadcast failed",
        "End broadcast request failed before backend confirmation.",
      );
    } finally {
      setActionPending(false);
    }
  }, [publisherSession, setSnapshot, updateOperationReceipt]);

  const handleRefresh = useCallback(() => {
    void reload();
  }, [reload]);

  return (
    <BroadcastControlWizard
      snapshot={snapshot}
      loading={loading}
      error={error}
      actionMessage={actionMessage}
      operationReceipt={operationReceipt}
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
