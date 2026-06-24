"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  setBroadcastCameraEngineStatus,
  setBroadcastLocalCameraActive,
  readBroadcastCameraEngineStatus,
} from "@/lib/broadcast/local-camera-session";
import { DEV_MANIFEST_FALLBACK_HLS } from "@/lib/live/manifest-dev-fallback";
import { normalizeRtmpUrl } from "@/lib/live/rtmp";
import { classifyRtmpStreamLink } from "@/lib/live/rtmp-pull";
import type { PullEngineStatus } from "@/lib/ops/ops-stream-state";
import { testHlsPreviewUrlClientOnly } from "@/lib/ops/test-hls-preview-client";
import {
  DEFAULT_STUDIO_ENGINE_MODE,
  type StudioEngineMode,
} from "@/lib/ops/studio-engine-mode";
import { splitRtmpIngestUrl, buildPrimaryRtmpIngestUrl, DEFAULT_RTMP_INGEST_SERVER_BASE } from "@/lib/stream-keys";

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
  onSaveIngest?: (primaryRtmpIngestUrl: string) => Promise<void>;
};

export function StreamKeyGeneratorCard({
  canEdit,
  initialCredentials = null,
  onGenerated,
  onError,
  onSaveIngest,
}: StreamKeyGeneratorCardProps) {
  const [loading, setLoading] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [credentials, setCredentials] = useState<StreamKeyCredentials | null>(
    initialCredentials,
  );
  const [manualServerUrl, setManualServerUrl] = useState(DEFAULT_RTMP_INGEST_SERVER_BASE);
  const [manualStreamKey, setManualStreamKey] = useState("");

  useEffect(() => {
    const serverUrl = initialCredentials?.serverUrl?.trim() ?? "";
    const streamKey = initialCredentials?.streamKey?.trim() ?? "";
    if (!serverUrl || !streamKey) return;

    setCredentials({ serverUrl, streamKey });
    setManualServerUrl(serverUrl);
    setManualStreamKey(streamKey);
  }, [initialCredentials?.serverUrl, initialCredentials?.streamKey]);

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
        const primaryRtmpIngestUrl =
          data.primaryRtmpIngestUrl ??
          buildPrimaryRtmpIngestUrl(data.streamKey, data.serverUrl);
        setCredentials(nextCredentials);
        setManualServerUrl(nextCredentials.serverUrl);
        setManualStreamKey(nextCredentials.streamKey);
        onGenerated?.({ ...nextCredentials, primaryRtmpIngestUrl });
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

  const handleSaveManualIngest = useCallback(async () => {
    if (!canEdit || !onSaveIngest) return;

    const trimmedKey = manualStreamKey.trim();
    if (!trimmedKey) {
      onError?.("Enter your stream key before saving Host Ingest.");
      return;
    }

    const serverNormalized = normalizeRtmpUrl(manualServerUrl.trim());
    if (!serverNormalized) {
      onError?.(
        "RTMP server must be a single rtmp:// URL (example: rtmp://vitalorgansent.com/live).",
      );
      return;
    }

    const fullUrl = buildPrimaryRtmpIngestUrl(trimmedKey, serverNormalized);
    setSavingManual(true);
    try {
      await onSaveIngest(fullUrl);
      const nextCredentials = {
        serverUrl: serverNormalized,
        streamKey: trimmedKey,
      };
      setCredentials(nextCredentials);
      onGenerated?.({ ...nextCredentials, primaryRtmpIngestUrl: fullUrl });
    } catch (saveError) {
      onError?.(
        saveError instanceof Error ? saveError.message : "Unable to save Host Ingest.",
      );
    } finally {
      setSavingManual(false);
    }
  }, [canEdit, manualServerUrl, manualStreamKey, onError, onSaveIngest]);

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
            Safe Launch Mode: copy server + key to OBS. Port 1935 is used automatically when omitted
            from the server URL.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-brand-border p-6 text-center text-brand-muted">
          <HelpCircle className="mb-1 h-6 w-6 text-brand-muted/60" aria-hidden="true" />
          <p className="font-ui text-xs">No active ingest target generated.</p>
          <p className="mt-0.5 font-body text-[0.58rem] text-brand-muted/80">
            {canEdit
              ? "Generate credentials or paste your Restream server + stream key below."
              : "An admin or producer must generate ingest credentials for you."}
          </p>
        </div>
      )}

      {canEdit && onSaveIngest ? (
        <div className="mt-4 space-y-3 border-t border-brand-border pt-4">
          <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
            Paste Restream / brand RTMP credentials
          </p>
          <label className="block min-w-0">
            <span className="mb-1 block font-ui text-[0.48rem] uppercase text-brand-muted">
              Server (single rtmp:// header)
            </span>
            <input
              type="text"
              value={manualServerUrl}
              onChange={(event) => setManualServerUrl(event.target.value)}
              placeholder="rtmp://vitalorgansent.com/live"
              className="min-w-0 w-full truncate rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none focus:border-brand-purple"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1 block font-ui text-[0.48rem] uppercase text-brand-muted">
              Stream key
            </span>
            <input
              type="text"
              value={manualStreamKey}
              onChange={(event) => setManualStreamKey(event.target.value)}
              placeholder="re_11801878_event..."
              className="min-w-0 w-full truncate rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none focus:border-brand-purple"
            />
          </label>
          <button
            type="button"
            disabled={savingManual}
            onClick={() => void handleSaveManualIngest()}
            className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-brand-blue/40 bg-brand-blue/10 px-3 py-2 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-brand-blue transition hover:bg-brand-blue/20 disabled:opacity-60"
          >
            {savingManual ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Save Host Ingest
          </button>
        </div>
      ) : null}
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
  const [ingestCredentials, setIngestCredentials] = useState<{
    serverUrl: string;
    streamKey: string;
  } | null>(null);

  const loadConfig = useCallback(async () => {
    setError(null);
    setTestResult(null);
    setEngineOverride(
      readBroadcastCameraEngineStatus() === "running" ? "running" : null,
    );

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
            serverUrl?: string | null;
            streamKey?: string | null;
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

      const pullStored = merged.primaryRtmpPullUrl?.trim() ?? "";
      const ingestStored = merged.primaryRtmpIngestUrl?.trim() ?? "";
      if (pullStored) {
        setPullUrl(pullStored);
      } else if (ingestStored) {
        setPullUrl(ingestStored);
      } else {
        setPullUrl("");
      }

      setHlsUrl(merged.cameraPreviewHlsUrl ?? "");

      const loadedCredentials =
        ingestData?.serverUrl && ingestData?.streamKey
          ? { serverUrl: ingestData.serverUrl, streamKey: ingestData.streamKey }
          : splitRtmpIngestUrl(merged.primaryRtmpIngestUrl);
      setIngestCredentials(
        loadedCredentials
          ? {
              serverUrl: loadedCredentials.serverUrl,
              streamKey: loadedCredentials.streamKey,
            }
          : null,
      );
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
      const trimmedStreamLink = pullUrl.trim();
      const trimmedHls = hlsUrl.trim();
      const normalizedStreamLink = trimmedStreamLink
        ? normalizeRtmpUrl(trimmedStreamLink)
        : null;

      if (trimmedStreamLink && !normalizedStreamLink) {
        throw new Error(
          "Stream link must be a valid RTMP URL with a single rtmp:// header (example: rtmp://vitalorgansent.com/live/your-key).",
        );
      }

      const streamKind = normalizedStreamLink
        ? classifyRtmpStreamLink(normalizedStreamLink)
        : null;

      if (normalizedStreamLink && streamKind === "unknown") {
        throw new Error(
          "Stream link must be RTMP — brand push (rtmp://vitalorgansent.com/live/...), OBS push (rtmp://live.restream.io/live/...), or Restream pull (rtmp://pull.restream.io/pull/...).",
        );
      }

      let schemaDeferredWarning: string | null = null;

      if (streamKind === "push") {
        const ingestResponse = await fetch("/api/ops/stream-ingest", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primaryRtmpIngestUrl: normalizedStreamLink }),
          cache: "no-store",
        });

        const ingestData = (await ingestResponse.json()) as {
          success?: boolean;
          error?: string;
          schemaDeferred?: boolean;
          warning?: string;
        };

        if (!ingestResponse.ok || !ingestData.success) {
          throw new Error(ingestData.error ?? "Unable to save OBS push link to Host Ingest.");
        }

        if (ingestData.schemaDeferred && ingestData.warning) {
          schemaDeferredWarning = ingestData.warning;
        }
      }

      const pullPatchBody =
        streamKind === "pull"
          ? { primaryRtmpPullUrl: normalizedStreamLink }
          : streamKind === "push"
            ? { primaryRtmpPullUrl: null }
            : {};

      const streamPullPayload = {
        ...pullPatchBody,
        ...(trimmedHls ? { cameraPreviewHlsUrl: trimmedHls } : {}),
      };

      if (Object.keys(streamPullPayload).length > 0) {
        const response = await fetch("/api/ops/stream-pull", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(streamPullPayload),
          cache: "no-store",
        });

        const data = (await response.json()) as {
          success?: boolean;
          error?: string;
          schemaDeferred?: boolean;
          warning?: string;
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Unable to save Restream configuration.");
        }

        if (data.schemaDeferred && data.warning) {
          schemaDeferredWarning = data.warning;
        }
      }

      await loadConfig();
      onSaved?.();
      if (schemaDeferredWarning) {
        onShowToast?.(schemaDeferredWarning);
      } else if (streamKind === "push") {
        onShowToast?.(
          "OBS push link saved to Host Ingest. GO LIVE uses the dev HLS fallback when preview is empty.",
        );
      }
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save.");
    } finally {
      setIsSaving(false);
    }
  }, [canEdit, hlsUrl, loadConfig, onClose, onSaved, onShowToast, pullUrl]);

  const testConnection = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    setError(null);

    const isDevBuild = process.env.NODE_ENV === "development";
    const resolvedHlsUrl =
      hlsUrl.trim() || (isDevBuild ? DEV_MANIFEST_FALLBACK_HLS : "");

    const result = await testHlsPreviewUrlClientOnly(resolvedHlsUrl);
    if (result.ok && !hlsUrl.trim() && isDevBuild) {
      setTestResult(
        `${result.message} Dev desk preview will use the Mux fallback until you save a Restream HLS URL.`,
      );
    } else {
      setTestResult(result.message);
    }
    setIsTesting(false);
  }, [hlsUrl]);

  const handleStreamKeyGenerated = useCallback(
    (payload: { serverUrl: string; streamKey: string; primaryRtmpIngestUrl?: string | null }) => {
      setIngestCredentials({
        serverUrl: payload.serverUrl,
        streamKey: payload.streamKey,
      });
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

  const saveHostIngest = useCallback(
    async (primaryRtmpIngestUrl: string) => {
      const normalized = normalizeRtmpUrl(primaryRtmpIngestUrl);
      if (!normalized) {
        throw new Error("Invalid RTMP ingest URL.");
      }

      const response = await fetch("/api/ops/stream-ingest", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryRtmpIngestUrl: normalized }),
        cache: "no-store",
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        schemaDeferred?: boolean;
        warning?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to save Host Ingest.");
      }

      if (data.schemaDeferred && data.warning) {
        onShowToast?.(data.warning);
      }

      setConfig((current) =>
        current
          ? {
              ...current,
              primaryRtmpIngestUrl: normalized,
              primaryRtmpConfigured: true,
            }
          : current,
      );
      const savedCredentials = splitRtmpIngestUrl(normalized);
      if (savedCredentials) {
        setIngestCredentials({
          serverUrl: savedCredentials.serverUrl,
          streamKey: savedCredentials.streamKey,
        });
      }
      await loadConfig();
      onSaved?.();
      onShowToast?.("Host Ingest saved — use Start Camera Stream or push from OBS.");
    },
    [loadConfig, onSaved, onShowToast],
  );

  const handleGenerateInvite = useCallback(async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteUrl = `${origin}/dashboard/broadcast?webrtc=1&t=${Date.now()}`;
    const ok = await copyToClipboard(inviteUrl);
    onShowToast?.(
      ok ? "WebRTC invite link copied to clipboard." : `Invite link: ${inviteUrl}`,
    );
  }, [onShowToast]);

  const handleStartEngine = useCallback(() => {
    if (!canEdit) return;
    setError(null);

    if (studioEngineMode === "internal_studio") {
      setBroadcastLocalCameraActive(true);
      setEngineOverride("running");
      onShowToast?.("Local camera started — allow browser access when prompted.");
      onClose();
      return;
    }

    setBroadcastCameraEngineStatus("running");
    setEngineOverride("running");
    onShowToast?.(
      "Camera stream marked active — push from OBS to your RTMP server + stream key.",
    );
    onSaved?.();
  }, [canEdit, onClose, onSaved, onShowToast, studioEngineMode]);

  const handleStopEngine = useCallback(() => {
    setBroadcastLocalCameraActive(false);
    setBroadcastCameraEngineStatus("stopped");
    setEngineOverride("stopped");
    onShowToast?.("Camera stream stopped.");
  }, [onShowToast]);

  const streamLinkKind = useMemo(
    () => (pullUrl.trim() ? classifyRtmpStreamLink(pullUrl) : null),
    [pullUrl],
  );

  if (!isOpen) return null;

  const isRestreamMode = studioEngineMode === "restream_api";
  const isDevBuild = process.env.NODE_ENV === "development";
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

          <StreamKeyGeneratorCard
            canEdit={canEdit}
            initialCredentials={ingestCredentials}
            onGenerated={handleStreamKeyGenerated}
            onError={setError}
            onSaveIngest={saveHostIngest}
          />

          {isRestreamMode ? (
            <>
                <p className="mb-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
                  Stream Monitoring Links
                </p>

                {isDevBuild ? (
                  <p className="mb-3 rounded-lg border border-brand-blue/25 bg-brand-blue/10 px-3 py-2 text-[0.52rem] leading-relaxed text-brand-muted">
                    Desk test mode: leave Field 2 empty if needed — GO LIVE falls back to{" "}
                    <span className="font-mono text-brand-blue">{DEV_MANIFEST_FALLBACK_HLS}</span>
                  </p>
                ) : null}

                <div className="space-y-4">
                  <label className="block min-w-0">
                    <span className="mb-1.5 flex items-center gap-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
                      1. RTMP Pull Link (optional — vMix/OBS monitor)
                      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <input
                      type="text"
                      value={pullUrl}
                      onChange={(event) => setPullUrl(event.target.value)}
                      disabled={!canEdit}
                      readOnly={!canEdit}
                      placeholder="rtmp://pull.restream.io/pull/your-pull-id"
                      className="min-w-0 w-full truncate overflow-hidden rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-brand-purple focus:ring-1 focus:ring-brand-purple/40 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <p className="mt-1 text-[0.5rem] text-brand-muted">
                      Restream dashboard → RTMP Pull Links → Merge fields → copy here. OBS push
                      links (<span className="font-mono">live.restream.io/live</span>) save to Host
                      Ingest automatically.
                    </p>
                    {streamLinkKind === "push" ? (
                      <p className="mt-1.5 rounded border border-brand-purple/30 bg-brand-purple/10 px-2 py-1.5 text-[0.5rem] text-brand-purple">
                        Detected OBS push link — Save will store it under Host Ingest, not RTMP Pull.
                      </p>
                    ) : null}
                  </label>

                  <label className="block min-w-0">
                    <span className="mb-1.5 flex items-center gap-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
                      2. HLS Web Preview (optional in dev)
                      <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <input
                      type="text"
                      value={hlsUrl}
                      onChange={(event) => setHlsUrl(event.target.value)}
                      disabled={!canEdit}
                      readOnly={!canEdit}
                      placeholder="https://stream.mux.com/PLAYBACK_ID.m3u8"
                      className="min-w-0 w-full truncate overflow-hidden rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none transition focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/40 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <p className="mt-1 text-[0.5rem] text-brand-muted">
                      Browser-safe .m3u8 for in-dashboard preview. Restream does not expose this —
                      use Mux or your CDN manifest.
                    </p>
                  </label>
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
            ) : canEdit && !isRestreamMode ? (
              <button
                type="button"
                onClick={onClose}
                className="touch-target inline-flex items-center gap-1.5 rounded-lg border border-brand-purple/50 bg-brand-purple/20 px-4 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-brand-purple/30"
              >
                Done
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
