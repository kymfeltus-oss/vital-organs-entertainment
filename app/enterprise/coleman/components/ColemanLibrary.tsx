"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import ColemanErrorBanner from "@/app/enterprise/coleman/components/ColemanErrorBanner";
import {
  ColemanApiError,
  fetchSetlist,
} from "@/app/enterprise/coleman/lib/api-client";
import type { TrackData } from "@/app/enterprise/coleman/lib/types";

export default function ColemanLibrary() {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const entries = await fetchSetlist();
      setTracks(entries.filter((track) => track.audioFiles.length > 0));
    } catch (err) {
      setError(
        err instanceof ColemanApiError ? err.message : "Unable to load library.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="coleman-glass-panel">
      <h1 className="coleman-tool-title">LIBRARY</h1>
      <p className="coleman-tool-sub mb-4">Tracks with uploaded loops and stems</p>

      {error ? <ColemanErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      {loading ? (
        <div className="flex justify-center py-8">
            <Loader2 size={20} strokeWidth={1.25} className="coleman-spinner animate-spin" />
        </div>
      ) : tracks.length === 0 ? (
        <p className="coleman-empty-copy">
          No uploaded stems in the library yet. Upload stems from a setlist track menu.
        </p>
      ) : (
        tracks.map((track) => (
          <div key={track.id} className="coleman-track-row">
            <div className="min-w-0 flex-1">
              <p className="coleman-track-title">{track.title}</p>
              <p className="coleman-track-meta">
                {track.audioFiles.length} file{track.audioFiles.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
