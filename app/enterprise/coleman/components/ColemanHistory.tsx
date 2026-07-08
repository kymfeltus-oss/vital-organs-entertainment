"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import ColemanErrorBanner from "@/app/enterprise/coleman/components/ColemanErrorBanner";
import {
  ColemanApiError,
  fetchHistory,
} from "@/app/enterprise/coleman/lib/api-client";
import type { PlaybackHistoryEntry } from "@/app/enterprise/coleman/lib/types";

export default function ColemanHistory() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PlaybackHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const entries = await fetchHistory();
      setHistory(entries);
    } catch (err) {
      setError(
        err instanceof ColemanApiError
          ? err.message
          : "Unable to load playback history.",
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
      <h1 className="coleman-tool-title">HISTORY</h1>
      <p className="coleman-tool-sub mb-4">Recent live playback sessions</p>

      {error ? <ColemanErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      {loading ? (
        <div className="flex justify-center py-8">
            <Loader2 size={20} strokeWidth={1.25} className="coleman-spinner animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <p className="coleman-empty-copy">No playback history recorded yet.</p>
      ) : (
        history.map((entry) => (
          <div key={entry.id} className="coleman-track-row">
            <div className="min-w-0 flex-1">
              <p className="coleman-track-title">{entry.title}</p>
              <p className="coleman-track-meta">
                {new Date(entry.playedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
