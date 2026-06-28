"use client";

import { useCallback, useState } from "react";

type ExternalIngestCredentialsPanelProps = {
  rtmpUrl: string | null;
  streamKey: string | null;
  detail?: string | null;
  loading?: boolean;
};

function maskSecret(value: string): string {
  if (value.length <= 4) return "••••";
  return "•".repeat(Math.min(value.length, 24));
}

async function writeClipboardText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to legacy copy
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

export default function ExternalIngestCredentialsPanel({
  rtmpUrl,
  streamKey,
  detail = null,
  loading = false,
}: ExternalIngestCredentialsPanelProps) {
  const [revealed, setRevealed] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const copyValue = useCallback(async (label: string, value: string | null) => {
    if (!value) return;
    const copied = await writeClipboardText(value);
    if (copied) {
      setCopyMessage(`${label} copied.`);
      window.setTimeout(() => setCopyMessage(null), 2000);
      return;
    }
    setCopyMessage(`Unable to copy ${label.toLowerCase()}.`);
  }, []);

  const toggleReveal = useCallback(() => {
    setRevealed((prev) => !prev);
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="font-body text-sm text-slate-500">Loading ingest credentials…</p>
      ) : null}

      {detail ? <p className="font-body text-xs text-slate-400">{detail}</p> : null}
      {copyMessage ? <p className="font-body text-xs text-emerald-400">{copyMessage}</p> : null}

      <label className="block">
        <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-500">
          Custom RTMP URL
        </span>
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            value={rtmpUrl ?? "Not configured"}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-body text-sm text-slate-100"
          />
          <button
            type="button"
            disabled={!rtmpUrl}
            onClick={() => void copyValue("RTMP URL", rtmpUrl)}
            aria-label="Copy RTMP URL"
            className="shrink-0 rounded-lg border border-slate-600 px-3 font-ui text-base text-slate-200 disabled:opacity-40"
          >
            📋
          </button>
        </div>
      </label>

      <label className="block">
        <span className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-slate-500">
          Stream key
        </span>
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            type={revealed ? "text" : "password"}
            value={streamKey ? (revealed ? streamKey : maskSecret(streamKey)) : "Not configured"}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 font-body text-sm text-slate-100"
          />
          <button
            type="button"
            disabled={!streamKey}
            onClick={toggleReveal}
            aria-label={revealed ? "Hide stream key" : "Reveal stream key"}
            aria-pressed={revealed}
            className="shrink-0 rounded-lg border border-slate-600 px-3 font-ui text-base text-slate-200 disabled:opacity-40"
          >
            👁️
          </button>
          <button
            type="button"
            disabled={!streamKey}
            onClick={() => void copyValue("Stream key", streamKey)}
            aria-label="Copy stream key"
            className="shrink-0 rounded-lg border border-slate-600 px-3 font-ui text-base text-slate-200 disabled:opacity-40"
          >
            📋
          </button>
        </div>
      </label>

      <p className="font-body text-[0.65rem] text-slate-500">
        Paste these into vMix, OBS, or Larix on the production machine. Visible only to authorized
        owner accounts.
      </p>
    </div>
  );
}
