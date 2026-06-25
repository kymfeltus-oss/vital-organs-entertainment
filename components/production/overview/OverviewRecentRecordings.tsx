"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Film } from "lucide-react";

type RecordingRow = {
  id: string;
  title?: string;
  createdAt?: string;
  fileSizeLabel?: string;
  resolution?: string;
};

export default function OverviewRecentRecordings() {
  const [recordings, setRecordings] = useState<RecordingRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRecordings() {
      try {
        const response = await fetch("/api/ops/recordings?limit=4", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          recordings?: Array<{
            id: string;
            streamTitle?: string;
            createdAt?: string;
            recordingUrl?: string | null;
          }>;
        };
        if (cancelled) return;
        setRecordings(
          (data.recordings ?? []).map((row) => ({
            id: row.id,
            title: row.streamTitle,
            createdAt: row.createdAt,
            fileSizeLabel: row.recordingUrl ? "Recording available" : undefined,
            resolution: undefined,
          })),
        );
      } catch {
        // Recordings optional on overview
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void loadRecordings();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-xl border border-brand-border bg-brand-panel/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.12em] text-white">
          Recent Recordings
        </h2>
        <Link
          href="/production/recordings"
          className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-brand-blue"
        >
          View all
        </Link>
      </div>

      {!loaded ? (
        <p className="font-body text-sm text-brand-muted">Loading recordings…</p>
      ) : recordings.length === 0 ? (
        <p className="font-body text-sm text-brand-muted">No recordings yet</p>
      ) : (
        <ul className="space-y-2">
          {recordings.map((recording) => (
            <li
              key={recording.id}
              className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-black/30 px-3 py-2"
            >
              <span className="rounded-lg border border-brand-border bg-brand-panel p-2 text-brand-purple">
                <Film className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm text-white">
                  {recording.title ?? "Broadcast recording"}
                </p>
                <p className="font-body text-xs text-brand-muted">
                  {recording.createdAt
                    ? new Date(recording.createdAt).toLocaleString()
                    : "—"}
                  {recording.fileSizeLabel ? ` · ${recording.fileSizeLabel}` : ""}
                  {recording.resolution ? ` · ${recording.resolution}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
