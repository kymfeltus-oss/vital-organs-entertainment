type TrackWithAssets = {
  id: string;
  title: string;
  artist: string | null;
  musicalKey: string;
  bpm: number | null;
  createdAt: Date;
  audioFiles: Array<{ filename: string }>;
};

export type TrackResponse = {
  id: string;
  title: string;
  artist?: string;
  musicalKey: string;
  bpm: number;
  duration: string;
  audioFiles: string[];
  createdAt: string;
};

export type HistoryResponse = {
  id: string;
  trackId: string;
  title: string;
  playedAt: string;
};

export type TheoryResponse = {
  id: string;
  title: string;
  key: string;
  nashvilleNumbers: string;
  progressionLabel: string;
  churchMovement: string;
};

export function toTrackResponse(track: TrackWithAssets): TrackResponse {
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

export function toHistoryResponse(entry: {
  id: string;
  trackId: string;
  playedAt: Date;
  track: { title: string };
}): HistoryResponse {
  return {
    id: entry.id,
    trackId: entry.trackId,
    title: entry.track.title,
    playedAt: entry.playedAt.toISOString(),
  };
}

export function toTheoryResponse(entry: {
  id: string;
  name: string;
  numbers: string;
  chords: string;
  description: string | null;
}): TheoryResponse {
  return {
    id: entry.id,
    title: entry.name,
    key: entry.chords,
    nashvilleNumbers: entry.numbers.replace(/-/g, "  -  "),
    progressionLabel: entry.numbers,
    churchMovement: entry.description ?? "",
  };
}
