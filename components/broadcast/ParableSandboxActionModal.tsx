"use client";

import Link from "next/link";

type ParableSandboxActionModalProps = {
  action: "go_live" | "end_live";
  onCancel: () => void;
  onContinue: () => void;
};

export default function ParableSandboxActionModal({
  action,
  onCancel,
  onContinue,
}: ParableSandboxActionModalProps) {
  const isGoLive = action === "go_live";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parable-sandbox-modal-title"
    >
      <div className="w-full max-w-md rounded-lg border border-brand-purple/40 bg-brand-panel p-6 text-white shadow-2xl">
        <h3
          id="parable-sandbox-modal-title"
          className="mb-2 text-xl font-bold text-brand-purple neon-purple-glow"
        >
          Sandbox Isolated Environment
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-brand-muted">
          {isGoLive ? (
            <>
              Warning: Going live here runs completely within our isolated in-memory buffer. This
              will <strong className="text-white">not</strong> change the{" "}
              <code className="text-brand-purple">live_stream_state</code> database flag or reveal
              video feeds to attendees on the main platform.
            </>
          ) : (
            <>
              Warning: Ending live here only stops the in-memory PARABLE production path. This will{" "}
              <strong className="text-white">not</strong> stop vMix, Restream, or close attendee
              access on the main production platform.
            </>
          )}
        </p>
        <p className="mb-6 text-xs text-brand-muted">
          To update the main production pipeline for show day, navigate to the{" "}
          <Link
            href="/ops/live-hub/console"
            className="text-brand-blue underline hover:text-white"
          >
            Live Hub Control Room Console
          </Link>
          .
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-brand-border bg-brand-black px-4 py-2 text-sm font-medium text-brand-muted transition hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded border border-brand-purple/60 bg-brand-purple/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-purple/30 neon-purple-glow"
          >
            Continue in sandbox only
          </button>
        </div>
      </div>
    </div>
  );
}
