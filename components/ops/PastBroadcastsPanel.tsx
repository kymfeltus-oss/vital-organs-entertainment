"use client";

import { useCallback, useEffect, useState } from "react";
import { Film, Loader2, RefreshCw } from "lucide-react";
import type { PastBroadcastRecording } from "@/lib/ops/past-broadcast-recordings";

function formatBroadcastDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PastBroadcastsPanel() {
  const [recordings, setRecordings] = useState<PastBroadcastRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadRecordings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ops/recordings?limit=12", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load past broadcasts.");
      }

      const data = (await response.json()) as { recordings?: PastBroadcastRecording[] };
      setRecordings(data.recordings ?? []);
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load past broadcasts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecordings();
  }, [loadRecordings]);

  const handleSyncLatest = useCallback(async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const response = await fetch("/api/ops/recordings/sync", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        cache: "no-store",
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        created?: boolean;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Recording sync failed.");
      }

      setMessage(
        data.created
          ? "Latest Restream recording saved to the archive."
          : "Latest Restream recording refreshed in the archive.",
      );
      await loadRecordings();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Recording sync failed.");
    } finally {
      setSyncing(false);
    }
  }, [loadRecordings]);

  return (
    <section
      aria-label="Past broadcasts and replays"
      className="rounded-xl border border-white/10 bg-[#111111]/90 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-[#1E40AF]" aria-hidden="true" />
          <div>
            <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-zinc-300">
              Past Broadcasts & Replays
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Restream cloud recordings synced into your ops archive.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSyncLatest()}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-white transition hover:bg-white/5 disabled:opacity-60"
        >
          {syncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          Sync Latest
        </button>
      </div>

      {message ? (
        <p className="mt-3 rounded border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">
          {message}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-xs text-zinc-500">Loading archive…</p>
        ) : recordings.length === 0 ? (
          <p className="text-xs text-zinc-500">
            No saved recordings yet. Finish a show, then sync the latest Restream event.
          </p>
        ) : (
          recordings.map((recording) => (
            <article
              key={recording.id}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {recording.streamTitle}
                  </p>
                  <p className="mt-1 text-[0.65rem] text-zinc-500">
                    {formatBroadcastDate(recording.broadcastDate)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {recording.recordingUrl ? (
                    <a
                      href={recording.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[#1E40AF]/40 bg-[#1E40AF]/10 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#93c5fd]"
                    >
                      Video
                    </a>
                  ) : null}
                  {recording.audioOnlyUrl ? (
                    <a
                      href={recording.audioOnlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/15 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-zinc-300"
                    >
                      Audio
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
