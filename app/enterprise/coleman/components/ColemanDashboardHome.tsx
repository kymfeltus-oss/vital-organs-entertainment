"use client";

import Link from "next/link";
import {
  ChevronRight,
  KeyRound,
  Loader2,
  Map,
  MoreVertical,
  Pause,
  Play,
  Radio,
  Timer,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import ColemanErrorBanner from "@/app/enterprise/coleman/components/ColemanErrorBanner";
import { useColemanAudio } from "@/app/enterprise/coleman/components/ColemanAudioProvider";
import {
  audioStreamUrl,
  fetchSetlist,
  recordPlayback,
  uploadStem,
  ColemanApiError,
} from "@/app/enterprise/coleman/lib/api-client";
import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";
import type { TrackData } from "@/app/enterprise/coleman/lib/types";

const FEATURE_CARDS = [
  {
    href: COLEMAN_ROUTES.tuner,
    title: "TUNER",
    subtitle: "Live pitch lock",
    Icon: Radio,
  },
  {
    href: COLEMAN_ROUTES.keyFinder,
    title: "KEY FINDER",
    subtitle: "Detect song key",
    Icon: KeyRound,
  },
  {
    href: COLEMAN_ROUTES.metronome,
    title: "METRONOME",
    subtitle: "Tempo guide",
    Icon: Timer,
  },
  {
    href: COLEMAN_ROUTES.theoryRoadmap,
    title: "THEORY ROADMAP",
    subtitle: "NNS & progressions",
    Icon: Map,
  },
] as const;

export default function ColemanDashboardHome() {
  const { currentlyPlayingTrackId, toggleTrack } = useColemanAudio();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [setlist, setSetlist] = useState<TrackData[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTrackIdRef = useRef<string | null>(null);

  const loadSetlist = useCallback(async () => {
    try {
      setLoading(true);
      setApiError(null);
      const tracks = await fetchSetlist();
      setSetlist(tracks);
    } catch (error) {
      const message =
        error instanceof ColemanApiError
          ? error.message
          : "Unable to load the service setlist.";
      setApiError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSetlist();
  }, [loadSetlist]);

  const triggerUpload = (trackId: string) => {
    uploadTrackIdRef.current = trackId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const targetId = uploadTrackIdRef.current;
    if (!file || !targetId) return;

    try {
      setUploading(true);
      setApiError(null);
      await uploadStem(targetId, file);
      await loadSetlist();
    } catch (error) {
      const message =
        error instanceof ColemanApiError
          ? error.message
          : "Stem upload failed.";
      setApiError(message);
    } finally {
      setUploading(false);
      uploadTrackIdRef.current = null;
    }
  };

  const handlePlayTrack = async (track: TrackData) => {
    if (track.audioFiles.length === 0) {
      setApiError("Upload a loop or stem before playing this track.");
      return;
    }

    try {
      setApiError(null);
      const wasPlaying = currentlyPlayingTrackId === track.id;
      await toggleTrack(track.id, audioStreamUrl(track.audioFiles[0]));
      if (!wasPlaying) {
        await recordPlayback(track.id);
      }
    } catch (error) {
      const message =
        error instanceof ColemanApiError
          ? error.message
          : "Playback failed. Check uploaded audio file.";
      setApiError(message);
    }
  };

  const formatTrackMeta = (track: TrackData) => {
    const key = track.musicalKey || "Open";
    const bpm = track.bpm ? `${track.bpm} BPM` : "Var. Tempo";
    const duration =
      track.duration && track.duration !== "—" ? track.duration : "—";
    return `${key} • ${bpm} • ${duration}`;
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/wav,audio/mpeg,audio/mp4,audio/aiff,audio/aac,audio/flac,audio/ogg"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {apiError ? (
        <ColemanErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
      ) : null}

      <div className="coleman-feature-grid coleman-feature-grid--home">
        {FEATURE_CARDS.map(({ href, title, subtitle, Icon }) => (
          <Link key={href} href={href} className="coleman-feature-card coleman-icon-stroke">
            <div className="coleman-icon-pod">
              <Icon size={24} strokeWidth={1.25} />
            </div>
            <p className="coleman-feature-title">{title}</p>
            <p className="coleman-feature-sub">{subtitle}</p>
            <ChevronRight size={14} className="coleman-feature-chevron" strokeWidth={1.25} />
          </Link>
        ))}
      </div>

      <section className="coleman-glass-panel">
        <div className="coleman-setlist-header">
          <h2 className="coleman-panel-heading mb-0">SERVICE SETLIST</h2>
          <span className="coleman-song-count">{setlist.length} SONGS</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} strokeWidth={1.25} className="coleman-spinner animate-spin" />
          </div>
        ) : setlist.length === 0 ? (
          <p className="coleman-empty-copy">
            No songs in the service setlist yet.
          </p>
        ) : (
          setlist.map((track) => {
            const isPlaying = currentlyPlayingTrackId === track.id;
            return (
              <div
                key={track.id}
                className={`coleman-track-row${isPlaying ? " is-active" : ""}`}
              >
                <button
                  type="button"
                  className={`coleman-play-btn${isPlaying ? " is-active" : ""}`}
                  onClick={() => void handlePlayTrack(track)}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause size={13} strokeWidth={1.25} />
                  ) : (
                    <Play size={13} strokeWidth={1.25} className="ml-0.5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="coleman-track-title">{track.title}</p>
                  <p className="coleman-track-meta">{formatTrackMeta(track)}</p>
                  {track.audioFiles.length > 0 ? (
                    <p className="coleman-stem-badge">
                      {track.audioFiles.length} stem
                      {track.audioFiles.length > 1 ? "s" : ""} attached
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="coleman-menu-btn"
                  onClick={() => triggerUpload(track.id)}
                  aria-label="Upload stem for track"
                  disabled={uploading}
                >
                  <MoreVertical size={16} strokeWidth={1.25} />
                </button>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
