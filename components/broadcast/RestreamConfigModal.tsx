"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  HelpCircle,
  KeyRound,
  Link2,
  Loader2,
  Play,
  Save,
  Square,
  X,
} from "lucide-react";
import StudioEngineSelector from "@/components/broadcast/StudioEngineSelector";
import SimulationTestingStrip from "@/components/broadcast/SimulationTestingStrip";
import { copyToClipboard } from "@/lib/clipboard";
import type { PullEngineStatus } from "@/lib/ops/ops-stream-state";
import { testHlsPreviewUrlClientOnly } from "@/lib/ops/test-hls-preview-client";
import {
  DEFAULT_STUDIO_ENGINE_MODE,
  type StudioEngineMode,
} from "@/lib/ops/studio-engine-mode";
import { splitRtmpIngestUrl } from "@/lib/stream-keys";

export type RestreamStreamConfig = {
  primaryRtmpIngestUrl: string | null;
  primaryRtmpPullUrl: string | null;
  cameraPreviewHlsUrl: string | null;
  primaryRtmpConfigured: boolean;
  primaryRtmpPullConfigured: boolean;
  cameraPreviewConfigured: boolean;
  studioEngineMode: StudioEngineMode;
};

type RestreamConfigModalProps = {
  isOpen: boolean;
  canEdit: boolean;
  initialStudioEngineMode?: StudioEngineMode;
  pullEngineStatus?: PullEngineStatus;
  onClose: () => void;
  onSaved?: () => void;
  onShowToast?: (message: string) => void;
};

type StreamKeyCredentials = {
  serverUrl: string;
  streamKey: string;
};

type StreamKeyGeneratorCardProps = {
  canEdit: boolean;
  initialCredentials?: StreamKeyCredentials | null;
  onGenerated?: (payload: StreamKeyCredentials & { primaryRtmpIngestUrl?: string | null }) => void;
  onError?: (message: string) => void;
};

export function StreamKeyGeneratorCard({
  canEdit,
  initialCredentials = null,
  onGenerated,
  onError,
}: StreamKeyGeneratorCardProps) {
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [credentials, setCredentials] = useState<StreamKeyCredentials | null>(
    initialCredentials,
  );

  useEffect(() => {
    setCredentials(initialCredentials);
  }, [initialCredentials]);

  const handleGenerateKey = useCallback(async () => {
    if (!canEdit) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ops/stream-ingest/generate", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        serverUrl?: string;
        streamKey?: string;
        primaryRtmpIngestUrl?: string | null;
      };

      if (data.success && data.serverUrl && data.streamKey) {
        const nextCredentials = {
          serverUrl: data.serverUrl,
          streamKey: data.streamKey,
        };
        setCredentials(nextCredentials);
        onGenerated?.({ ...nextCredentials, primaryRtmpIngestUrl: data.primaryRtmpIngestUrl });
      } else {
        const message = data.error ?? "Unable to generate camera stream key.";
        onError?.(message);
        console.error("Failed to generate stream key:", message);
      }
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : "Network error while generating stream key.";
      onError?.(message);
      console.error("Network error while generating stream key:", generateError);
    } finally {
      setLoading(false);
    }
  }, [canEdit, onError, onGenerated]);

  const handleCopy = useCallback(async (text: string, type: "url" | "key") => {
    const success = await copyToClipboard(text);
    if (!success) return;

    if (type === "url") {
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedKey(true);
      window.setTimeout(() => setCopiedKey(false), 2000);
    }
  }, []);

  return (
    <div className="w-full rounded-xl border border-brand-border bg-brand-black p-4 text-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <KeyRound className="h-4 w-4 shrink-0 text-brand-purple" aria-hidden="true" />
          <span className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
            Host Ingest Configuration (For External Cameras)
          </span>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => void handleGenerateKey()}
            disabled={loading}
            className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/50 bg-brand-purple/20 px-3 py-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-white shadow-[0_0_15px_rgba(138,46,255,0.15)] transition hover:bg-brand-purple/30 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>Generating…</span>
              </>
            ) : (
              <span>Generate New Operator Path</span>
            )}
          </button>
        ) : null}
      </div>

      {credentials ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 flex items-center gap-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
              RTMP Server URL
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-panel/60 p-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-white">
                {credentials.serverUrl}
              </code>
              <button
                type="button"
                onClick={() => void handleCopy(credentials.serverUrl, "url")}
                className="touch-target shrink-0 rounded p-1 text-brand-muted transition hover:bg-brand-black hover:text-white"
                title="Copy Server URL"
                aria-label="Copy Server URL"
              >
                {copiedUrl ? (
                  <Check className="h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
              Secure Stream Key
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-brand-panel/60 p-2">
              <code className="min-w-0 flex-1 truncate font-mono text-xs font-bold text-brand-purple">
                {credentials.streamKey}
              </code>
              <button
                type="button"
                onClick={() => void handleCopy(credentials.streamKey, "key")}
                className="touch-target shrink-0 rounded p-1 text-brand-muted transition hover:bg-brand-black hover:text-white"
                title="Copy Stream Key"
                aria-label="Copy Stream Key"
              >
                {copiedKey ? (
                  <Check className="h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <p className="mt-2 font-body text-[0.58rem] italic leading-normal text-brand-muted">
            Safe Launch Mode: copy and send both generated parameters directly to your external
            camera operator.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-brand-border p-6 text-center text-brand-muted">
          <HelpCircle className="mb-1 h-6 w-6 text-brand-muted/60" aria-hidden="true" />
          <p className="font-ui text-xs">No active ingest target generated.</p>
          <p className="mt-0.5 font-body text-[0.58rem] text-brand-muted/80">
            {canEdit
              ? "Click the button above to provision credentials for an external provider."
              : "An admin or producer must generate ingest credentials for you."}
          </p>
        </div>
      )}
    </div>
  );
}

export default function RestreamConfigModal({
  isOpen,
  canEdit,
  initialStudioEngineMode = DEFAULT_STUDIO_ENGINE_MODE,
  pullEngineStatus = "stopped",
  onClose,
  onSaved,
  onShowToast,
}: RestreamConfigModalProps) {
  const [config, setConfig] = useState<RestreamStreamConfig | null>(null);
  const [studioEngineMode, setStudioEngineMode] = useState<StudioEngineMode>(
    initialStudioEngineMode,
  );
  const [pullUrl, setPullUrl] = useState("");
  const [hlsUrl, setHlsUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEngineSaving, setIsEngineSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [engineOverride, setEngineOverride] = useState<PullEngineStatus | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    setError(null);
    setTestResult(null);
    setEngineOverride(null);

    try {
      const [pullRes, ingestRes, engineRes] = await Promise.all([
        fetch("/api/ops/stream-pull", { credentials: "include", cache: "no-store" }),
        fetch("/api/ops/stream-ingest", { credentials: "include", cache: "no-store" }),
        fetch("/api/ops/stream-engine", { credentials: "include", cache: "no-store" }),
      ]);

      const pullData = pullRes.ok
        ? ((await pullRes.json()) as {
            primaryRtmpPullUrl?: string | null;
            cameraPreviewHlsUrl?: string | null;
            primaryRtmpPullConfigured?: boolean;
            cameraPreviewConfigured?: boolean;
          })
        : null;

      const ingestData = ingestRes.ok
        ? ((await ingestRes.json()) as {
            primaryRtmpIngestUrl?: string | null;
            primaryRtmpConfigured?: boolean;
          })
        : null;

      const engineData = engineRes.ok
        ? ((await engineRes.json()) as { studioEngineMode?: StudioEngineMode })
        : null;

      const mode = engineData?.studioEngineMode ?? initialStudioEngineMode;

      const merged: RestreamStreamConfig = {
        primaryRtmpIngestUrl: ingestData?.primaryRtmpIngestUrl ?? null,
        primaryRtmpPullUrl: pullData?.primaryRtmpPullUrl ?? null,
        cameraPreviewHlsUrl: pullData?.cameraPreviewHlsUrl ?? null,
        primaryRtmpConfigured: ingestData?.primaryRtmpConfigured === true,
        primaryRtmpPullConfigured: pullData?.primaryRtmpPullConfigured === true,
        cameraPreviewConfigured: pullData?.cameraPreviewConfigured === true,
        studioEngineMode: mode,
      };

      setConfig(merged);
      setStudioEngineMode(mode);
      setPullUrl(merged.primaryRtmpPullUrl ?? "");
      setHlsUrl(merged.cameraPreviewHlsUrl ?? "");
    } catch {
      setError("Unable to load broadcast engine configuration.");
    }
  }, [initialStudioEngineMode]);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      void loadConfig();
    });
  }, [isOpen, loadConfig]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const handleEngineModeChange = useCallback(
    async (mode: StudioEngineMode) => {
      if (!canEdit || mode === studioEngineMode) return;

      setIsEngineSaving(true);
      setError(null);

      try {
        const response = await fetch("/api/ops/stream-engine", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studioEngineMode: mode }),
          cache: "no-store",
        });

        const data = (await response.json()) as {
          success?: boolean;
          studioEngineMode?: StudioEngineMode;
          error?: string;
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Unable to update studio engine mode.");
        }

        const nextMode = data.studioEngineMode ?? mode;
        setStudioEngineMode(nextMode);
        setConfig((current) =>
          current ? { ...current, studioEngineMode: nextMode } : current,
        );
        onSaved?.();
      } catch (engineError) {
        setError(
          engineError instanceof Error
            ? engineError.message
            : "Unable to update studio engine mode.",
        );
      } finally {
        setIsEngineSaving(false);
      }
    },
    [canEdit, onSaved, studioEngineMode],
  );

  const saveConfiguration = useCallback(async () => {
    if (!canEdit) return;

    setIsSaving(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch("/api/ops/stream-pull", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryRtmpPullUrl: pullUrl.trim() || null,
          cameraPreviewHlsUrl: hlsUrl.trim() || null,
        }),
        cache: "no-store",
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to save Restream configuration.");
      }

      await loadConfig();
      onSaved?.();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }, [canEdit, hlsUrl, loadConfig, onClose, onSaved, pullUrl]);

  const testConnection = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    const result = await testHlsPreviewUrlClientOnly(hlsUrl);
    setTestResult(result.message);
    setIsTesting(false);
  }, [hlsUrl]);

  const handleStreamKeyGenerated = useCallback(
    (payload: { serverUrl: string; streamKey: string; primaryRtmpIngestUrl?: string | null }) => {
      setConfig((current) =>
        current
          ? {
              ...current,
              primaryRtmpIngestUrl:
                payload.primaryRtmpIngestUrl ?? current.primaryRtmpIngestUrl,
              primaryRtmpConfigured: true,
            }
          : current,
      );
      onSaved?.();
      onShowToast?.(
        "New operator path generated. Copy the server URL and stream key to your encoder.",
      );
    },
    [onSaved, onShowToast],
  );

  const handleGenerateInvite = useCallback(async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/dashboard/broadcast?webrtc=1&t=${Date.now()}`;
    const ok = await copyToClipboard(inviteUrl);
    onShowToast?.(
      ok ? "WebRTC invite link copied to clipboard." : `Invite link: ${inviteUrl}`,
    );
  }, [onShowToast]);

  // TODO: wire Start/Stop Engine to ops pull-engine service when backend lands.
  const handleStartEngine = useCallback(() => {
    setEngineOverride("running");
    onShowToast?.("Camera stream started (practice mode).");
  }, [onShowToast]);

  const handleStopEngine = useCallback(() => {
    setEngineOverride("stopped");
    onShowToast?.("Camera stream stopped.");
  }, [onShowToast]);

  if (!isOpen) return null;

  const ingestCredentials = splitRtmpIngestUrl(config?.primaryRtmpIngestUrl);
  const isRestreamMode = studioEngineMode === "restream_api";
  const engineStatus = engineOverride ?? pullEngineStatus;
  const engineStatusLabel =
    engineStatus === "running"
      ? "Healthy & Running"
      : engineStatus === "error"
        ? "Needs Attention"
        : "Standby";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close broadcast configuration"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restream-config-modal-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-brand-border bg-brand-panel p-6 text-white shadow-[0_0_40px_rgba(138,46,255,0.15)]"
      >
        <header className="flex items-center justify-between border-b border-brand-border pb-4">
          <h2
            id="restream-config-modal-title"
            className="font-headline text-base uppercase tracking-[0.08em] text-white sm:text-lg"
          >
            Console Studio Setup
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="touch-target rounded-lg p-1 text-brand-muted transition hover:bg-brand-black hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="my-5 space-y-5 font-body text-sm">
          <StudioEngineSelector
            value={studioEngineMode}
            canEdit={canEdit}
            isSaving={isEngineSaving}
            onChange={(mode) => void handleEngineModeChange(mode)}
          />

          {isRestreamMode ? (
            <>
              <StreamKeyGeneratorCard
                canEdit={canEdit}
                initialCredentials={
                  ingestCredentials
                    ? {
                        serverUrl: ingestCredentials.serverUrl,
                        streamKey: ingestCredentials.streamKey,
                      }
                    : null
                }
                onGenerated={handleStreamKeyGenerated}
                onError={setError}
              />

              <div>
                <p className="mb-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                  Private Camera Stream Links
                </p>

                <div className="space-y-4">
                  <label className="block min-w-0">
                    <span className="mb-1.5 flex items-center gap-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
                      1. Paste Your Private Stream Link Here
                      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <input
                      type="text"
                      value={pullUrl}
                      onChange={(event) => setPullUrl(event.target.value)}
                      disabled={!canEdit}
                      readOnly={!canEdit}
                      placeholder="Paste the long link from your streaming dashboard"
                      className="min-w-0 w-full truncate overflow-hidden rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/40 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <p className="mt-1 text-[0.5rem] text-brand-muted">
                      Paste the unified, single-line private link from your streaming dashboard.
                    </p>
                  </label>

                  <label className="block min-w-0">
                    <span className="mb-1.5 flex items-center gap-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
                      2. Paste Your Web Preview Link Here
                      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <input
                      type="text"
                      value={hlsUrl}
                      onChange={(event) => setHlsUrl(event.target.value)}
                      disabled={!canEdit}
                      readOnly={!canEdit}
                      placeholder="Paste the web preview link ending in .m3u8"
                      className="min-w-0 w-full truncate overflow-hidden rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <p className="mt-1 text-[0.5rem] text-brand-muted">
                      Required so this dashboard can show the camera picture in the browser.
                    </p>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3 rounded-lg border border-brand-purple/30 bg-brand-purple/10 p-3">
              <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-purple">
                In-App Camera Room
              </p>
              <p className="text-[0.58rem] leading-relaxed text-brand-muted">
                Cloud stream link fields are hidden in this mode. Generate an invite link so
                remote operators can connect phones or webcams directly.
              </p>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => void handleGenerateInvite()}
                  className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/50 bg-brand-purple/20 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-brand-purple/30"
                >
                  <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
                  + Generate WebRTC Invite Link
                </button>
              ) : null}
            </div>
          )}

          <div className="rounded-lg border border-zinc-800/60 bg-brand-black/50 p-3">
            <p className="mb-1 font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
              Stream Health
            </p>
            <p className="font-ui text-[0.58rem] uppercase">
              Camera Stream Status:{" "}
              <span
                className={
                  engineStatus === "running"
                    ? "text-emerald-400"
                    : engineStatus === "error"
                      ? "text-red-400 animate-pulse"
                      : "text-zinc-300"
                }
              >
                {engineStatusLabel}
              </span>
            </p>
          </div>

          {!canEdit ? (
            <p className="rounded-lg border border-brand-border bg-brand-black/40 px-3 py-2 font-ui text-[0.52rem] uppercase text-brand-muted">
              Read-only — an admin or producer must save changes for you.
            </p>
          ) : null}

          {testResult ? (
            <p className="rounded-lg border border-brand-blue/30 bg-brand-blue/10 px-3 py-2 text-xs text-brand-blue">
              {testResult}
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 text-xs text-brand-pink"
            >
              {error}
            </p>
          ) : null}

          <SimulationTestingStrip onShowToast={onShowToast} />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-border pt-4">
          <div className="flex flex-wrap gap-2">
            {isRestreamMode ? (
              <button
                type="button"
                disabled={isTesting}
                onClick={() => void testConnection()}
                className="touch-target rounded-lg border border-brand-blue/40 bg-brand-blue/10 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-brand-blue transition hover:bg-brand-blue/20 disabled:opacity-60"
              >
                {isTesting ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : null}
                Test Preview Link
              </button>
            ) : null}
            {canEdit ? (
              <>
                <button
                  type="button"
                  onClick={handleStartEngine}
                  className="touch-target inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase text-emerald-400 transition hover:bg-emerald-500/20"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  Start Camera Stream
                </button>
                <button
                  type="button"
                  onClick={handleStopEngine}
                  className="touch-target inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-brand-black px-3 py-2 font-ui text-[0.52rem] font-bold uppercase text-zinc-300 transition hover:border-brand-pink/40"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                  Stop Camera Stream
                </button>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="touch-target rounded-lg bg-brand-black px-4 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-brand-muted transition hover:text-white"
            >
              Cancel
            </button>
            {canEdit && isRestreamMode ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void saveConfiguration()}
                className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/50 bg-brand-purple/20 px-4 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-white shadow-[0_0_15px_rgba(138,46,255,0.2)] transition hover:bg-brand-purple/30 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                Save Settings
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
