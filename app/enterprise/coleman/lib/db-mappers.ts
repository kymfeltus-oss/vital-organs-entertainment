import type {
  AudioAsset,
  PlaybackHistory,
  TheoryProgression,
  Track,
} from "@/app/enterprise/coleman/lib/generated/prisma";

import type {
  PlaybackHistoryEntry,
  TheoryEntry,
  TrackData,
} from "./types";

type TrackWithAssets = Track & { audioFiles: AudioAsset[] };
type HistoryWithTrack = PlaybackHistory & { track: Track };

export function toTrackData(track: TrackWithAssets): TrackData {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist ?? "Unknown Artist",
    musicalKey: track.musicalKey,
    bpm: track.bpm ?? 0,
    duration: "—",
    audioFiles: track.audioFiles.map((asset) => asset.filename),
    createdAt: track.createdAt.toISOString(),
  };
}

export function toPlaybackHistoryEntry(entry: HistoryWithTrack): PlaybackHistoryEntry {
  return {
    id: entry.id,
    trackId: entry.trackId,
    title: entry.track.title,
    playedAt: entry.playedAt.toISOString(),
  };
}

export function toTheoryEntry(entry: TheoryProgression): TheoryEntry {
  return {
    id: entry.id,
    title: entry.name,
    key: entry.chords,
    nashvilleNumbers: entry.numbers.replace(/-/g, "  -  "),
    progressionLabel: entry.numbers,
    churchMovement: entry.description ?? "",
  };
}

export function inferStemType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("click")) return "Click";
  if (lower.includes("cue")) return "Cue";
  if (lower.includes("pad")) return "Pad";
  if (lower.includes("loop")) return "Loop";
  if (lower.includes("keys")) return "Keys";
  if (lower.includes("drums")) return "Drums";
  if (lower.includes("bass")) return "Bass";
  return "Other";
}
