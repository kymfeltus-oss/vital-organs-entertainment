"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Radio } from "lucide-react";
import { RTMP_INGEST_REQUIREMENT, formatRtmpIngestLaneLabel } from "@/lib/live/rtmp";
import type { OpsSnapshot } from "@/lib/ops/types";

type LiveHubRtmpIngestPanelProps = {
  snapshot: OpsSnapshot;
  canEdit: boolean;
  onSaved?: () => void | Promise<void>;
};

function RtmpCopyField({
  label,
  url,
  status,
  configured,
}: {
  label: string;
  url: string | null;
  status: OpsSnapshot["stream"]["primaryRtmpIngestUrlStatus"];
  configured: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copyUrl = useCallback(async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <div className="rounded-xl border border-brand-border bg-brand-black/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
            {label}
          </p>
          <p className="mt-1 font-mono text-[0.68rem] text-zinc-300 break-all">
            {url ?? "Not configured"}
          </p>
          <p className="mt-1 text-[0.58rem] text-brand-muted">
            {formatRtmpIngestLaneLabel(status, configured)}
          </p>
        </div>
        {url ? (
          <button
            type="button"
            onClick={() => void copyUrl()}
            className="touch-target inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-purple/40 bg-brand-purple/10 px-3 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-brand-purple/20"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-brand-purple" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function LiveHubRtmpIngestPanel({
  snapshot,
  canEdit,
  onSaved,
}: LiveHubRtmpIngestPanelProps) {
  const [primaryDraft, setPrimaryDraft] = useState(
    snapshot.stream.primaryRtmpIngestUrl ?? "",
  );
  const [backupDraft, setBackupDraft] = useState(
    snapshot.stream.backupRtmpIngestUrl ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPrimaryDraft(snapshot.stream.primaryRtmpIngestUrl ?? "");
    setBackupDraft(snapshot.stream.backupRtmpIngestUrl ?? "");
  }, [snapshot.stream.primaryRtmpIngestUrl, snapshot.stream.backupRtmpIngestUrl]);

  const saveIngestUrls = useCallback(async () => {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/ops/stream-ingest", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryRtmpIngestUrl: primaryDraft.trim() || null,
          backupRtmpIngestUrl: backupDraft.trim() || null,
        }),
        cache: "no-store",
      });

      const data = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to save RTMP ingest URLs.");
      }

      setMessage("RTMP ingest URLs saved.");
      await onSaved?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save RTMP ingest URLs.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [backupDraft, onSaved, primaryDraft]);

  const generateCameraStreamKey = useCallback(async () => {
    setIsGeneratingKey(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/ops/stream-ingest/generate", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json()) as {
        error?: string;
        success?: boolean;
        primaryRtmpIngestUrl?: string | null;
        streamKey?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to generate camera stream key.");
      }

      if (data.primaryRtmpIngestUrl) {
        setPrimaryDraft(data.primaryRtmpIngestUrl);
      }

      const keyLabel = data.streamKey ? ` (${data.streamKey})` : "";
      setMessage(`New camera stream key generated${keyLabel}.`);
      await onSaved?.();
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Unable to generate camera stream key.",
      );
    } finally {
      setIsGeneratingKey(false);
    }
  }, [onSaved]);

  const provisionFromRestream = useCallback(async () => {
    setIsProvisioning(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/ops/stream-ingest", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json()) as {
        error?: string;
        success?: boolean;
        primaryRtmpIngestUrl?: string | null;
        ingestServerName?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Unable to create RTMP URL from Restream.");
      }

      if (data.primaryRtmpIngestUrl) {
        setPrimaryDraft(data.primaryRtmpIngestUrl);
      }

      const serverLabel = data.ingestServerName ? ` (${data.ingestServerName})` : "";
      setMessage(`Primary RTMP URL created from Restream${serverLabel}.`);
      await onSaved?.();
    } catch (provisionError) {
      setError(
        provisionError instanceof Error
          ? provisionError.message
          : "Unable to create RTMP URL from Restream.",
      );
    } finally {
      setIsProvisioning(false);
    }
  }, [onSaved]);

  const isBusy = isSaving || isProvisioning || isGeneratingKey;

  return (
    <section className="rounded-2xl border border-brand-purple/30 bg-brand-panel p-4 shadow-[0_0_20px_rgba(138,46,255,0.12)]">
      <div className="mb-3 flex items-start gap-2">
        <Radio className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" aria-hidden="true" />
        <div>
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.2em] text-brand-purple">
            Camera RTMP Ingest
          </p>
          <p className="mt-1 font-body text-xs text-brand-muted">
            Push URLs for OBS, mobile apps, or encoders. Paste into your camera app — playback
            for attendees still uses HLS <code className="text-brand-blue">.m3u8</code> output.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <RtmpCopyField
          label="Primary RTMP push"
          url={snapshot.stream.primaryRtmpIngestUrl}
          status={snapshot.stream.primaryRtmpIngestUrlStatus}
          configured={snapshot.stream.primaryRtmpConfigured}
        />
        <RtmpCopyField
          label="Backup RTMP push"
          url={snapshot.stream.backupRtmpIngestUrl}
          status={snapshot.stream.backupRtmpIngestUrlStatus}
          configured={snapshot.stream.backupRtmpConfigured}
        />
      </div>

      {canEdit ? (
        <div className="mt-4 space-y-3 border-t border-brand-border pt-4">
          <label className="block">
            <span className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
              Edit primary RTMP URL
            </span>
            <input
              type="url"
              value={primaryDraft}
              onChange={(event) => setPrimaryDraft(event.target.value)}
              placeholder="rtmp://live.restream.io/live/your-stream-key"
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none focus:border-brand-purple/50"
            />
          </label>
          <label className="block">
            <span className="font-ui text-[0.55rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
              Edit backup RTMP URL
            </span>
            <input
              type="url"
              value={backupDraft}
              onChange={(event) => setBackupDraft(event.target.value)}
              placeholder="rtmps://backup.example.com/live/key"
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-mono text-xs text-white outline-none focus:border-brand-purple/50"
            />
          </label>
          <p className="text-[0.58rem] text-brand-muted">{RTMP_INGEST_REQUIREMENT}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void generateCameraStreamKey()}
              className="touch-target inline-flex items-center gap-2 rounded-full border border-brand-pink/50 bg-brand-pink/15 px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-brand-pink/25 disabled:opacity-60"
            >
              {isGeneratingKey ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Radio className="h-3.5 w-3.5 text-brand-pink" aria-hidden="true" />
              )}
              Generate Camera Stream Key
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void provisionFromRestream()}
              className="touch-target inline-flex items-center gap-2 rounded-full border border-brand-blue/50 bg-brand-blue/15 px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-brand-blue/25 disabled:opacity-60"
            >
              {isProvisioning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Radio className="h-3.5 w-3.5 text-brand-blue" aria-hidden="true" />
              )}
              Create from Restream
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void saveIngestUrls()}
              className="touch-target inline-flex items-center gap-2 rounded-full border border-brand-purple/50 bg-brand-purple/15 px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-brand-purple/25 disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              Save RTMP URLs
            </button>
          </div>
          <p className="text-[0.55rem] text-brand-muted">
            Create from Restream uses your account stream key and ingest server. Requires{" "}
            <code className="text-brand-blue">RESTREAM_API_TOKEN</code> on the server.
          </p>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 text-xs text-brand-blue">{message}</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-xs text-brand-pink">
          {error}
        </p>
      ) : null}
    </section>
  );
}
