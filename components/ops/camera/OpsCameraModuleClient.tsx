"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CameraDeskMobileView from "@/components/ops/CameraDeskMobileView";
import HostIngestPanel from "@/components/ops/camera/HostIngestPanel";
import OpsViewTabs from "@/components/ops/shell/OpsViewTabs";
import { useOpsStreamStateRealtime } from "@/hooks/useOpsStreamStateRealtime";
import { useRoleGate } from "@/hooks/useRoleGate";
import {
  buildOpsModuleHref,
  normalizeOpsView,
  OPS_CAMERA_VIEWS,
  OPS_MODULE_ROUTES,
} from "@/lib/ops/ops-module-nav";
import { splitRtmpIngestUrl } from "@/lib/stream-keys";
import type { OpsSnapshot } from "@/lib/ops/types";

function OpsCameraMatrixPanel({ stream }: { stream: OpsSnapshot["stream"] | null }) {
  const rows = [
    { label: "Primary ingest", value: stream?.primaryRtmpConfigured ? "Valid" : "Missing" },
    { label: "Backup ingest", value: stream?.backupConfigured ? "Valid" : "Optional" },
    { label: "RTMP pull", value: stream?.primaryRtmpPullConfigured ? "Configured" : "Missing" },
    { label: "HLS preview", value: stream?.cameraPreviewConfigured ? "Configured" : "Missing" },
    { label: "Active source", value: stream?.activeSource ?? "offline" },
    { label: "Mobile key", value: stream?.activeMobileStreamKey ? "Active" : "None" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="glass-panel rounded-xl border border-brand-border p-4">
          <p className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            {row.label}
          </p>
          <p className="mt-2 font-ui text-sm font-bold uppercase text-white">{row.value}</p>
        </div>
      ))}
    </div>
  );
}

function OpsCameraModuleInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = normalizeOpsView(searchParams.get("view"), OPS_CAMERA_VIEWS, "ingest");
  const roleGate = useRoleGate();
  const { stream } = useOpsStreamStateRealtime();

  const [ingestCredentials, setIngestCredentials] = useState<{
    serverUrl: string;
    streamKey: string;
  } | null>(null);
  const [hlsPreviewUrl, setHlsPreviewUrl] = useState("");
  const [ingestError, setIngestError] = useState<string | null>(null);
  const [phoneStreamKey, setPhoneStreamKey] = useState<string | null>(null);

  const canEditIngest = roleGate.role === "admin" || roleGate.role === "producer";

  useEffect(() => {
    if (searchParams.get("view")) return;
    router.replace(buildOpsModuleHref(OPS_MODULE_ROUTES.camera, "ingest"));
  }, [router, searchParams]);

  const loadIngest = useCallback(async () => {
    try {
      const [ingestRes, pullRes] = await Promise.all([
        fetch("/api/ops/stream-ingest", { credentials: "include", cache: "no-store" }),
        fetch("/api/ops/stream-pull", { credentials: "include", cache: "no-store" }),
      ]);

      if (ingestRes.ok) {
        const data = (await ingestRes.json()) as {
          serverUrl?: string | null;
          streamKey?: string | null;
          primaryRtmpIngestUrl?: string | null;
        };
        const creds =
          data.serverUrl && data.streamKey
            ? { serverUrl: data.serverUrl, streamKey: data.streamKey }
            : splitRtmpIngestUrl(data.primaryRtmpIngestUrl);
        setIngestCredentials(creds);
      }

      if (pullRes.ok) {
        const pullData = (await pullRes.json()) as { cameraPreviewHlsUrl?: string | null };
        setHlsPreviewUrl(pullData.cameraPreviewHlsUrl ?? "");
      }
    } catch {
      setIngestError("Unable to load camera ingest configuration.");
    }
  }, []);

  useEffect(() => {
    void loadIngest();
  }, [loadIngest]);

  useEffect(() => {
    if (view !== "mobile-desk") return;

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

  const saveHostIngest = useCallback(async (primaryRtmpIngestUrl: string) => {
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
    await loadIngest();
  }, [loadIngest]);

  const saveHlsPreview = useCallback(async () => {
    const response = await fetch("/api/ops/stream-pull", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cameraPreviewHlsUrl: hlsPreviewUrl.trim() || null }),
      cache: "no-store",
    });
    const data = (await response.json()) as { success?: boolean; error?: string };
    if (!response.ok || !data.success) {
      setIngestError(data.error ?? "Unable to save HLS preview URL.");
      return;
    }
    setIngestError(null);
  }, [hlsPreviewUrl]);

  const viewTabs = OPS_CAMERA_VIEWS.map((id) => ({
    id,
    label: id.replace("-", " "),
    href: buildOpsModuleHref(OPS_MODULE_ROUTES.camera, id),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-brand-border px-4 py-4 md:px-6">
        <h1 className="font-headline text-fluid-section uppercase tracking-[0.1em]">Camera</h1>
        <p className="mt-1 font-body text-sm text-brand-muted">
          Ingest credentials and input matrix
        </p>
        <div className="mt-4">
          <OpsViewTabs tabs={viewTabs} activeId={view} ariaLabel="Camera module views" />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        {ingestError ? (
          <p className="mb-4 rounded-lg border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-sm text-brand-pink">
            {ingestError}
          </p>
        ) : null}

        {view === "ingest" ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
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
            <label className="block glass-panel rounded-xl border border-brand-border p-4">
              <span className="mb-2 block font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                Camera preview HLS URL
              </span>
              <input
                type="text"
                value={hlsPreviewUrl}
                onChange={(event) => setHlsPreviewUrl(event.target.value)}
                disabled={!canEditIngest}
                placeholder="https://stream.mux.com/PLAYBACK_ID.m3u8"
                className="w-full rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none focus:border-brand-blue disabled:opacity-60"
              />
              {canEditIngest ? (
                <button
                  type="button"
                  onClick={() => void saveHlsPreview()}
                  className="touch-target mt-3 rounded-lg border border-brand-blue/40 bg-brand-blue/10 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-brand-blue"
                >
                  Save HLS Preview
                </button>
              ) : null}
            </label>
          </div>
        ) : null}

        {view === "matrix" ? <OpsCameraMatrixPanel stream={stream} /> : null}

        {view === "mobile-desk" ? (
          <CameraDeskMobileView phoneStreamKey={phoneStreamKey} />
        ) : null}
      </main>
    </div>
  );
}

export default function OpsCameraModuleClient() {
  return (
    <Suspense fallback={null}>
      <OpsCameraModuleInner />
    </Suspense>
  );
}
