"use client";

import {
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";

import { useExploreStudio } from "@/app/enterprise/coleman/components/explore/ExploreStudioContext";

export default function ExploreMediaBar() {
  const { bpm, timeSignature, volume, setVolume, transportPlaying, toggleTransport } = useExploreStudio();

  return (
    <footer className="exo-media-bar exo-outset">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Volume2 size={16} strokeWidth={1.35} className="shrink-0 text-[var(--exo-muted)]" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="exo-range max-w-[72px]"
          aria-label="Volume"
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="exo-outset exo-outset-btn rounded-full p-2" aria-label="Repeat">
          <Repeat size={14} />
        </button>
        <button type="button" className="exo-outset exo-outset-btn rounded-full p-2" aria-label="Skip back">
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="exo-outset exo-outset-btn flex h-11 w-11 items-center justify-center rounded-full"
          onClick={toggleTransport}
          aria-label={transportPlaying ? "Pause" : "Play"}
        >
          {transportPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button type="button" className="exo-outset exo-outset-btn rounded-full p-2" aria-label="Skip forward">
          <SkipForward size={14} />
        </button>
        <button type="button" className="exo-outset exo-outset-btn rounded-full p-2" aria-label="Shuffle">
          <Shuffle size={14} />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-[8px] font-medium tracking-wide text-[var(--exo-muted)]">
        <span className="whitespace-nowrap">{bpm} BPM</span>
        <span className="whitespace-nowrap">{timeSignature} TIME</span>
        <button type="button" className="exo-outset exo-outset-btn rounded-full p-1.5" aria-label="More options">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </footer>
  );
}
