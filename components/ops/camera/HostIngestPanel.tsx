"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, HelpCircle, KeyRound, Loader2, Save } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";
import { normalizeRtmpUrl } from "@/lib/live/rtmp";
import {
  buildPrimaryRtmpIngestUrl,
  DEFAULT_RTMP_INGEST_SERVER_BASE,
} from "@/lib/stream-keys";

export type HostIngestCredentials = {
  serverUrl: string;
  streamKey: string;
};

export type HostIngestPanelProps = {
  canEdit: boolean;
  initialCredentials?: HostIngestCredentials | null;
  onGenerated?: (
    payload: HostIngestCredentials & { primaryRtmpIngestUrl?: string | null },
  ) => void;
  onError?: (message: string) => void;
  onSaveIngest?: (primaryRtmpIngestUrl: string) => Promise<void>;
};

export default function HostIngestPanel({
  canEdit,
  initialCredentials = null,
  onGenerated,
  onError,
  onSaveIngest,
}: HostIngestPanelProps) {
  const [loading, setLoading] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardWarning, setCardWarning] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<HostIngestCredentials | null>(
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
    setCardError(null);
    setCardWarning(null);
    try {
      const response = await fetch("/api/ops/stream-ingest/generate", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        warning?: string | null;
        persisted?: boolean;
        serverUrl?: string;
        streamKey?: string;
        primaryRtmpIngestUrl?: string | null;
      };

      if (!response.ok || !data.success) {
        const message =
          data.error ??
          (response.status === 403
            ? "You need admin or producer permissions to generate stream keys."
            : `Unable to generate camera stream key (${response.status}).`);
        setCardError(message);
        onError?.(message);
        return;
      }

      if (!data.serverUrl || !data.streamKey) {
        const message = "Generate response was missing server URL or stream key.";
        setCardError(message);
        onError?.(message);
        return;
      }

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

      if (data.warning) {
        setCardWarning(data.warning);
      } else if (data.persisted === false) {
        setCardWarning(
          "Stream key created for OBS, but it could not be saved to the database. Copy it now.",
        );
      }
    } catch (generateError) {
      const message =
        generateError instanceof Error
          ? generateError.message
          : "Network error while generating stream key.";
      setCardError(message);
      onError?.(message);
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

      {cardError ? (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-brand-pink/40 bg-brand-pink/10 px-3 py-2 font-body text-[0.58rem] leading-relaxed text-brand-pink"
        >
          {cardError}
        </p>
      ) : null}

      {cardWarning ? (
        <p
          role="status"
          className="mb-3 rounded-lg border border-brand-blue/30 bg-brand-blue/10 px-3 py-2 font-body text-[0.58rem] leading-relaxed text-brand-muted"
        >
          {cardWarning}
        </p>
      ) : null}

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
