"use client";

import type { SongOverview } from "./shared/types";

type SongOverviewDrawerProps = {
  overview: SongOverview;
  onClose: () => void;
};

export default function SongOverviewDrawer({
  overview,
  onClose,
}: SongOverviewDrawerProps) {
  return (
    <div
      className="coleman-sheet-overlay flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Song overview"
      onClick={onClose}
    >
      <div
        className="coleman-sheet w-full p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="coleman-sheet-badge">
          <span aria-hidden>♪</span>
          MATCH FOUND VIA SHAZAM
        </div>

        <h2 className="coleman-sheet-title">{overview.title}</h2>
        <p className="coleman-sheet-artist">{overview.artist}</p>

        <hr className="coleman-sheet-divider" />

        <div className="coleman-sheet-stat-grid">
          <div>
            <p className="coleman-sheet-stat-label">ORIGINAL KEY</p>
            <p className="coleman-sheet-stat-value is-gold">{overview.originalKey}</p>
          </div>
          <div>
            <p className="coleman-sheet-stat-label">TEMPO</p>
            <p className="coleman-sheet-stat-value">{overview.tempoBpm} BPM</p>
          </div>
          <div>
            <p className="coleman-sheet-stat-label">CHURCH MOVEMENT</p>
            <p className="coleman-sheet-stat-value">{overview.churchMovement}</p>
          </div>
        </div>

        <p className="coleman-sheet-section-label mt-6">NASHVILLE NUMBER SYSTEM</p>
        <div className="coleman-nns-box">
          {overview.nashvilleNumbers}
          <span className="coleman-nns-sub">({overview.progressionLabel})</span>
        </div>

        <button type="button" className="coleman-sheet-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
