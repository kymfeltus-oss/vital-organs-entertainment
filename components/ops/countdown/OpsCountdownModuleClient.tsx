"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import CameraDeskMobileView from "@/components/ops/CameraDeskMobileView";
import CountdownAdminClient, {
  type LiftedCountdownRealtime,
} from "@/components/ops/CountdownAdminClient";
import HostIngestPanel from "@/components/ops/camera/HostIngestPanel";
import OpsDrawer from "@/components/ops/OpsDrawer";
import OpsIncidentDrawerContent from "@/components/ops/countdown/OpsIncidentDrawerContent";
import OpsPrayerQueueDrawerContent from "@/components/ops/countdown/OpsPrayerQueueDrawerContent";
import OpsViewTabs from "@/components/ops/shell/OpsViewTabs";
import { useCountdownChatTroubleAlerts } from "@/hooks/useCountdownChatTroubleAlerts";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { useRoleGate } from "@/hooks/useRoleGate";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import {
  buildOpsModuleHref,
  OPS_MODULE_ROUTES,
} from "@/lib/ops/ops-module-nav";
import { splitRtmpIngestUrl } from "@/lib/stream-keys";
import type { OpsSnapshot } from "@/lib/ops/types";

const COUNTDOWN_MODULE_VIEWS = ["console", "camera", "incident", "prayer"] as const;
type CountdownModuleView = (typeof COUNTDOWN_MODULE_VIEWS)[number];

type OpsCountdownModuleClientProps = {
  adminEmail: string;
  initialConfig: EventCountdownConfig;
  initialSnapshot: OpsSnapshot;
};

function resolveCountdownView(raw: string | null): CountdownModuleView {
  if (raw === "camera" || raw === "incident" || raw === "prayer") return raw;
  return "console";
}

function CameraMatrixGrid({ stream }: { stream: OpsSnapshot["stream"] | null }) {
  const slots = [
    { label: "Slot 1 — Primary ingest", value: stream?.primaryRtmpConfigured ? "Valid" : "Missing" },
    { label: "Slot 2 — Backup ingest", value: stream?.backupConfigured ? "Valid" : "Optional" },
    { label: "Slot 3 — RTMP pull", value: stream?.primaryRtmpPullConfigured ? "Configured" : "Missing" },
    { label: "Slot 4 — HLS preview", value: stream?.cameraPreviewConfigured ? "Configured" : "Missing" },
    { label: "Slot 5 — Active source", value: stream?.activeSource ?? "offline" },
    { label: "Slot 6 — Mobile key", value: stream?.activeMobileStreamKey ? "Active" : "None" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => (
        <div key={slot.label} className="glass-panel rounded-xl border border-brand-border p-4">
          <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            {slot.label}
          </p>
          <p className="mt-2 font-ui text-sm font-bold uppercase text-white">{slot.value}</p>
        </div>
      ))}
    </div>
  );
}

function OpsCountdownModuleInner({
  adminEmail,
  initialConfig,
  initialSnapshot,
}: OpsCountdownModuleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = resolveCountdownView(searchParams.get("view"));

  const roleGate = useRoleGate();
  const { stream, opsState } = useOpsStreamStateRealtime();
  const chat = useCountdownChatTroubleAlerts();

  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [ingestCredentials, setIngestCredentials] = useState<{
    serverUrl: string;
    streamKey: string;
  } | null>(null);
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [phoneStreamKey, setPhoneStreamKey] = useState<string | null>(null);

  const activeStream = stream ?? snapshot.stream;

  useEffect(() => {
    if (searchParams.get("view")) return;
    router.replace(buildOpsModuleHref(OPS_MODULE_ROUTES.countdown, "console"));
  }, [router, searchParams]);

  useEffect(() => {
    if (!stream) return;
    setSnapshot((current) => ({
      ...current,
      stream,
      realtime: {
        ...current.realtime,
        lastStreamStateSyncAt: stream.updatedAt,
      },
    }));
  }, [stream]);

  const liftedRealtime: LiftedCountdownRealtime = useMemo(
    () => ({
      stream: activeStream,
      opsState,
      messages: chat.messages,
      chatLoading: chat.isLoading,
      chatConnected: chat.isConnected,
      issueType: chat.issueType,
      troubleCount: chat.count,
      clearChatAlert: chat.clear,
    }),
    [activeStream, opsState, chat],
  );

  const loadCameraIngest = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/stream-ingest", {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as {
        serverUrl?: string | null;
        streamKey?: string | null;
        primaryRtmpIngestUrl?: string | null;
      };
      const creds =
        data.serverUrl && data.streamKey
          ? { serverUrl: data.serverUrl, streamKey: data.streamKey }
          : splitRtmpIngestUrl(data.primaryRtmpIngestUrl);
      setIngestCredentials(creds);
    } catch {
      setIngestError("Unable to load camera ingest configuration.");
    }
  }, []);

  useEffect(() => {
    if (view !== "camera") return;
    void loadCameraIngest();
  }, [view, loadCameraIngest]);

  useEffect(() => {
    if (view !== "camera") return;

    let cancelled = false;

    async function initializeMobileSession() {
      try {
        const response = await fetch("/api/ops/camera-desk/session", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operatorName: "phone_operator" }),
          cache: "no-store",
        });

        const data = (await response.json()) as {
          success?: boolean;
          streamKey?: string;
          error?: string;
        };

        if (!response.ok || !data.success || !data.streamKey) {
          throw new Error(data.error ?? "Unable to register mobile stream key.");
        }

        if (!cancelled) setPhoneStreamKey(data.streamKey);
      } catch (error) {
        console.error("Failed to register mobile console keys", error);
      }
    }

    void initializeMobileSession();
    return () => {
      cancelled = true;
    };
  }, [view]);

  const saveHostIngest = useCallback(
    async (primaryRtmpIngestUrl: string) => {
      const response = await fetch("/api/ops/stream-ingest", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryRtmpIngestUrl }),
        cache: "no-store",
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to save Host Ingest.");
      }
      await loadCameraIngest();
    },
    [loadCameraIngest],
  );

  const closeDrawer = useCallback(() => {
    router.replace(buildOpsModuleHref(OPS_MODULE_ROUTES.countdown, "console"));
  }, [router]);

  const viewTabs = COUNTDOWN_MODULE_VIEWS.map((id) => ({
    id,
    label: id,
    href: buildOpsModuleHref(OPS_MODULE_ROUTES.countdown, id),
  }));

  const canEditIngest = roleGate.role === "admin" || roleGate.role === "producer";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-brand-black text-white">
      {view !== "console" ? (
        <header className="shrink-0 border-b border-brand-border px-3 py-2 md:px-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate font-body text-[0.65rem] text-brand-muted md:text-xs">{adminEmail}</p>
            <OpsViewTabs tabs={viewTabs} activeId={view} ariaLabel="Countdown module views" />
          </div>
        </header>
      ) : null}

      {view === "console" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CountdownAdminClient
            adminEmail={adminEmail}
            initialConfig={initialConfig}
            liftedRealtime={liftedRealtime}
          />
        </div>
      ) : null}

      {view === "camera" ? (
        <main className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 md:p-6">
          {ingestError ? (
            <p className="rounded-lg border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink">
              {ingestError}
            </p>
          ) : null}

          <HostIngestPanel
            canEdit={canEditIngest}
            initialCredentials={ingestCredentials}
            onGenerated={(payload) => {
              setIngestCredentials({
                serverUrl: payload.serverUrl,
                streamKey: payload.streamKey,
              });
            }}
            onError={setIngestError}
            onSaveIngest={saveHostIngest}
          />

          <div>
            <h2 className="mb-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
              6-Slot Camera Matrix
            </h2>
            <CameraMatrixGrid stream={activeStream} />
          </div>

          <div>
            <h2 className="mb-3 font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
              Mobile Desk
            </h2>
            <CameraDeskMobileView phoneStreamKey={phoneStreamKey} />
          </div>
        </main>
      ) : null}

      <OpsDrawer open={view === "incident"} title="Incident Log" onClose={closeDrawer}>
        <OpsIncidentDrawerContent accessLogs={snapshot.accessLogs} />
      </OpsDrawer>

      <OpsDrawer open={view === "prayer"} title="Prayer Queue" onClose={closeDrawer}>
        <OpsPrayerQueueDrawerContent />
      </OpsDrawer>
    </div>
  );
}

export default function OpsCountdownModuleClient(props: OpsCountdownModuleClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-brand-blue" aria-hidden="true" />
        </div>
      }
    >
      <OpsCountdownModuleInner {...props} />
    </Suspense>
  );
}
