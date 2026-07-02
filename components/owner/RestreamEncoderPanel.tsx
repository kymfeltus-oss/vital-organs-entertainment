"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Eye, EyeOff, Loader2, Radio, Save } from "lucide-react";
import type { EncoderHealthStatus } from "@/lib/owner/encoder-health";

export type RestreamEncoderFields = {
  primaryIngestEndpoint: string;
  streamKey: string;
  attendeePlaybackHlsUrl: string;
};

type RestreamEncoderPanelProps = {
  fields: RestreamEncoderFields;
  health: EncoderHealthStatus | "checking";
  healthDetail: string | null;
  saving: boolean;
  disabled?: boolean;
  saveMessage?: string | null;
  saveError?: string | null;
  lastSavedLabel?: string | null;
  onChange: (fields: RestreamEncoderFields) => void;
  onSave: () => void;
};

function CopyFieldButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={!value.trim()}
      aria-label={`Copy ${label}`}
      className="grid h-7 w-7 shrink-0 place-items-center rounded border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-lime-300" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function healthTone(status: RestreamEncoderPanelProps["health"]): {
  dot: string;
  text: string;
  label: string;
} {
  if (status === "checking") {
    return { dot: "bg-sky-300", text: "text-sky-300", label: "CHECKING ENCODER..." };
  }
  if (status === "online") {
    return {
      dot: "bg-lime-400 shadow-[0_0_12px_rgba(132,255,75,0.8)]",
      text: "text-lime-300",
      label: "ENCODER ONLINE — READY TO LAUNCH",
    };
  }
  if (status === "offline") {
    return { dot: "bg-amber-300", text: "text-amber-300", label: "ENCODER OFFLINE" };
  }
  return { dot: "bg-white/30", text: "text-white/45", label: "ENCODER UNCONFIGURED" };
}

export default function RestreamEncoderPanel({
  fields,
  health,
  healthDetail,
  saving,
  disabled = false,
  saveMessage,
  saveError,
  lastSavedLabel,
  onChange,
  onSave,
}: RestreamEncoderPanelProps) {
  const [showStreamKey, setShowStreamKey] = useState(false);
  const tone = healthTone(health);
  const isBusy = saving || disabled;

  return (
    <section
      data-testid="restream-encoder-panel"
      className="min-h-0 overflow-hidden rounded-[6px] border border-cyan-400/20 bg-[#050814]/94 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_28px_rgba(0,168,255,0.12)]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1.5">
        <div className="min-w-0">
          <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-white/72 sm:text-[0.64rem]">
            Restream RTMP &amp; Stream Key
          </span>
          <p className="mt-0.5 font-body text-[0.48rem] text-white/45">
            Paste from Restream → save here → copy into OBS
          </p>
        </div>
        <Radio className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden="true" />
      </div>

      <div className="grid gap-2 p-2 lg:grid-cols-[1fr_auto]">
        <div className="grid min-w-0 gap-2">
          <div
            data-testid="encoder-health-badge"
            className={`inline-flex min-w-0 items-center gap-1.5 font-ui text-[0.5rem] font-black uppercase sm:text-[0.58rem] ${tone.text}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
            {tone.label}
          </div>
          {healthDetail ? (
            <p className="truncate font-body text-[0.48rem] text-white/45">{healthDetail}</p>
          ) : null}

          <label className="grid gap-1">
            <span className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] text-white/55">
              RTMP Server URL
            </span>
            <div className="flex gap-1">
              <input
                type="text"
                value={fields.primaryIngestEndpoint}
                disabled={isBusy}
                onChange={(event) =>
                  onChange({ ...fields, primaryIngestEndpoint: event.target.value })
                }
                placeholder="rtmp://live.restream.io/live"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 rounded border border-white/10 bg-black/45 px-2 py-1.5 font-mono text-[0.58rem] text-white/90 outline-none focus:border-cyan-400/40 disabled:opacity-50"
              />
              <CopyFieldButton value={fields.primaryIngestEndpoint} label="RTMP server URL" />
            </div>
          </label>

          <label className="grid gap-1">
            <span className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] text-white/55">
              Stream Key
            </span>
            <div className="flex gap-1">
              <input
                type={showStreamKey ? "text" : "password"}
                value={fields.streamKey}
                disabled={isBusy}
                onChange={(event) => onChange({ ...fields, streamKey: event.target.value })}
                placeholder="re_… or your Restream key"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 rounded border border-white/10 bg-black/45 px-2 py-1.5 font-mono text-[0.58rem] text-white/90 outline-none focus:border-cyan-400/40 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowStreamKey((current) => !current)}
                disabled={!fields.streamKey.trim()}
                aria-label={showStreamKey ? "Hide stream key" : "Show stream key"}
                className="grid h-7 w-7 shrink-0 place-items-center rounded border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {showStreamKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <CopyFieldButton value={fields.streamKey} label="stream key" />
            </div>
          </label>

          <label className="grid gap-1">
            <span className="font-ui text-[0.48rem] font-bold uppercase tracking-[0.08em] text-white/55">
              HLS Playback URL (.m3u8) — optional
            </span>
            <input
              type="url"
              value={fields.attendeePlaybackHlsUrl}
              disabled={isBusy}
              onChange={(event) =>
                onChange({ ...fields, attendeePlaybackHlsUrl: event.target.value })
              }
              placeholder="https://…/playlist.m3u8"
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded border border-white/10 bg-black/45 px-2 py-1.5 font-mono text-[0.58rem] text-white/90 outline-none focus:border-cyan-400/40 disabled:opacity-50"
            />
          </label>

          {saveError ? (
            <p role="alert" className="rounded border border-red-400/35 bg-red-500/10 px-2 py-1.5 font-body text-[0.52rem] text-red-200">
              {saveError}
            </p>
          ) : saveMessage ? (
            <p role="status" className="rounded border border-lime-300/35 bg-lime-300/10 px-2 py-1.5 font-body text-[0.52rem] text-lime-200">
              {saveMessage}
            </p>
          ) : null}

          {lastSavedLabel ? (
            <p className="font-body text-[0.48rem] text-white/40">{lastSavedLabel}</p>
          ) : null}
        </div>

        <div className="flex flex-col justify-end gap-2">
          <p className="font-body text-[0.48rem] leading-relaxed text-white/45">
            1. Paste RTMP URL + stream key from Restream
            <br />
            2. Click Save / Update
            <br />
            3. Copy into OBS → Start Streaming
            <br />
            4. Press GO LIVE when encoder badge turns green
          </p>
          <button
            type="button"
            data-testid="save-encoder-settings"
            disabled={isBusy}
            onClick={onSave}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-cyan-400/35 bg-cyan-400/12 px-3 font-ui text-[0.58rem] font-black uppercase tracking-[0.08em] text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-45 sm:text-xs"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save / Update Credentials
          </button>
        </div>
      </div>
    </section>
  );
}
