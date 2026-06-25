"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CountdownAdminClient, {
  type LiftedCountdownRealtime,
} from "@/components/ops/CountdownAdminClient";
import OpsDrawer from "@/components/ops/OpsDrawer";
import OpsIncidentDrawerContent from "@/components/ops/countdown/OpsIncidentDrawerContent";
import OpsPrayerQueueDrawerContent from "@/components/ops/countdown/OpsPrayerQueueDrawerContent";
import StreamControlPanel from "@/components/ops/countdown/StreamControlPanel";
import OpsViewTabs from "@/components/ops/shell/OpsViewTabs";
import { useCountdownChatTroubleAlerts } from "@/hooks/useCountdownChatTroubleAlerts";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import type { LiveHubHeartbeatPayload } from "@/lib/ops/live-hub-heartbeat";
import {
  buildOpsModuleHref,
  normalizeOpsView,
  OPS_COUNTDOWN_VIEWS,
  OPS_MODULE_ROUTES,
} from "@/lib/ops/ops-module-nav";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { OpsSnapshot, OpsStreamAction } from "@/lib/ops/types";

type OpsCountdownModuleClientProps = {
  adminEmail: string;
  initialConfig: EventCountdownConfig;
  initialSnapshot: OpsSnapshot;
};

function OpsCountdownModuleInner({
  adminEmail,
  initialConfig,
  initialSnapshot,
}: OpsCountdownModuleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = normalizeOpsView(searchParams.get("view"), OPS_COUNTDOWN_VIEWS, "console");

  const { stream, opsState } = useOpsStreamStateRealtime();
  const chat = useCountdownChatTroubleAlerts();

  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [pendingAction, setPendingAction] = useState<OpsStreamAction | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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

  const refreshSnapshot = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/live-hub/heartbeat", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as LiveHubHeartbeatPayload;
      setSnapshot(data.opsSnapshot);
    } catch {
      // keep last snapshot
    }
  }, []);

  const runStreamAction = useCallback(
    async (action: OpsStreamAction) => {
      setPendingAction(action);
      setActionMessage(null);

      try {
        const response = await fetch("/api/ops/stream-action", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
          cache: "no-store",
        });

        const data = (await response.json()) as { success?: boolean; error?: string };
        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Stream action failed.");
        }

        setActionMessage(
          action === "go_live"
            ? "Primary stream is now live for attendees."
            : action === "switch_backup"
              ? "Backup lane is now live for attendees."
              : "Stream is offline. Attendees see the holding state.",
        );

        await refreshSnapshot();
      } catch (error) {
        setActionMessage(error instanceof Error ? error.message : "Stream action failed.");
      } finally {
        setPendingAction(null);
      }
    },
    [refreshSnapshot],
  );

  const liftedRealtime: LiftedCountdownRealtime = useMemo(
    () => ({
      stream,
      opsState,
      messages: chat.messages,
      chatLoading: chat.isLoading,
      chatConnected: chat.isConnected,
      issueType: chat.issueType,
      troubleCount: chat.count,
      clearChatAlert: chat.clear,
    }),
    [stream, opsState, chat],
  );

  const closeDrawer = useCallback(() => {
    router.replace(buildOpsModuleHref(OPS_MODULE_ROUTES.countdown, "console"));
  }, [router]);

  const viewTabs = OPS_COUNTDOWN_VIEWS.map((id) => ({
    id,
    label: id,
    href: buildOpsModuleHref(OPS_MODULE_ROUTES.countdown, id),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-brand-border px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-headline text-lg uppercase tracking-[0.1em] md:text-xl">
              Countdown & Control
            </h1>
            <p className="font-body text-xs text-brand-muted">Schedule · go-live · safety drawers</p>
          </div>
          <OpsViewTabs tabs={viewTabs} activeId={view} ariaLabel="Countdown module views" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === "console" ? (
          <div className="space-y-4 p-4 md:p-6">
            <StreamControlPanel
              snapshot={snapshot}
              operatorEmail={adminEmail}
              pendingAction={pendingAction}
              actionMessage={actionMessage}
              onStreamAction={(action) => void runStreamAction(action)}
            />
            <CountdownAdminClient
              adminEmail={adminEmail}
              initialConfig={initialConfig}
              liftedRealtime={liftedRealtime}
            />
          </div>
        ) : null}
      </div>

      <OpsDrawer
        open={view === "incident"}
        title="Incident Log"
        onClose={closeDrawer}
      >
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
    <Suspense fallback={null}>
      <OpsCountdownModuleInner {...props} />
    </Suspense>
  );
}
