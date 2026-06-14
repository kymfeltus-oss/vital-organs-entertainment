"use client";

import { useCallback, useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";
import { resolveAmbientAudio } from "@/components/awakening/constants";
import WaveformGraphic from "@/components/awakening/WaveformGraphic";
import { cn } from "@/lib/utils";
import { EXPERIENCE_HUB_LAYOUT, HUB_SPEC_COLORS } from "@/lib/experience/hub-design-tokens";

type AudioPlayerProps = {
  className?: string;
  audioSrc?: string | null;
};

export default function AudioPlayer({ className, audioSrc }: AudioPlayerProps) {
  const { primary, fallback } = resolveAmbientAudio(audioSrc);
  const [audioFile, setAudioFile] = useState(primary);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const height = EXPERIENCE_HUB_LAYOUT.ambient.height;

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }, [playing]);

  const handleAudioError = useCallback(() => {
    if (audioFile !== fallback) {
      setAudioFile(fallback);
      setPlaying(false);
    }
  }, [audioFile, fallback]);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-white/10 px-4 backdrop-blur-xl shadow-2xl",
          className,
        )}
        style={{
          height,
          backgroundColor: "rgba(5, 8, 18, 0.8)",
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${HUB_SPEC_COLORS.purple}33`, color: HUB_SPEC_COLORS.purple }}
        >
          <Music2 className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-ui text-xs font-semibold text-white">Ambient Worship</span>
          {playing ? (
            <WaveformGraphic variant="blue" active />
          ) : (
            <div className="flex h-5 items-center gap-[3px] px-1 opacity-80">
              {[4, 8, 14, 10, 5, 12, 16, 7, 11, 4, 9, 13, 6].map((barHeight, index) => (
                <div
                  key={index}
                  className="w-[2px] rounded-full bg-gradient-to-t from-[#7B2DFF] to-[#00E6FF]"
                  style={{ height: `${barHeight}px` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            void togglePlayback();
          }}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition-all hover:bg-white/10 hover:text-white"
          aria-label={playing ? "Pause ambient worship" : "Play ambient worship"}
        >
          {playing ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={audioFile}
        loop
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={handleAudioError}
        className="sr-only"
      />
    </>
  );
}
