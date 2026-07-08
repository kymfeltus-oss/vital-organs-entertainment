"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import ColemanErrorBanner from "@/app/enterprise/coleman/components/ColemanErrorBanner";
import {
  ColemanApiError,
  fetchTheoryCatalog,
} from "@/app/enterprise/coleman/lib/api-client";
import type { TheoryEntry } from "@/app/enterprise/coleman/lib/types";

export default function ColemanTheoryRoadmap() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TheoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const catalog = await fetchTheoryCatalog();
        setEntries(catalog);
      } catch (err) {
        setError(
          err instanceof ColemanApiError
            ? err.message
            : "Unable to load theory roadmap.",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <section className="coleman-glass-panel">
      <h1 className="coleman-tool-title">THEORY ROADMAP</h1>
      <p className="coleman-tool-sub mb-4">Nashville Number System progressions</p>

      {error ? <ColemanErrorBanner message={error} onDismiss={() => setError(null)} /> : null}

      {loading ? (
        <div className="flex justify-center py-8">
            <Loader2 size={20} strokeWidth={1.25} className="coleman-spinner animate-spin" />
        </div>
      ) : (
        entries.map((entry) => (
          <div key={entry.id} className="coleman-theory-card">
            <p className="coleman-track-title">{entry.title}</p>
            <p className="coleman-track-meta">
              {entry.churchMovement} · {entry.key}
            </p>
            <p className="coleman-theory-numbers">{entry.nashvilleNumbers}</p>
            <p className="coleman-track-meta">({entry.progressionLabel})</p>
          </div>
        ))
      )}
    </section>
  );
}
