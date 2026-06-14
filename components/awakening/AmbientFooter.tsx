"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Pause, Play } from "lucide-react";
import WaveformGraphic from "@/components/awakening/WaveformGraphic";
import { AWAKENING_ASSETS, AWAKENING_COLORS, resolveAmbientAudio } from "@/components/awakening/constants";

type AmbientFooterProps = {
  audioSrc?: string | null;
};

export default function AmbientFooter({ audioSrc }: AmbientFooterProps) {
  const { primary, fallback } = resolveAmbientAudio(audioSrc);
  const [audioFile, setAudioFile] = useState(primary);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setAudioFile(primary);
  }, [primary]);

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
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-between px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-8">
        <div
          className="pointer-events-auto flex h-16 w-[min(340px,calc(100vw-2rem))] items-center gap-3 rounded-full border border-[#00E6FF]/55 px-3 backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(9,11,19,0.92)",
            boxShadow: "0 0 28px rgba(0,230,255,0.35)",
          }}
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FF007F]/50"
            style={{ color: AWAKENING_COLORS.pink, backgroundColor: `${AWAKENING_COLORS.pink}12` }}
          >
            <Music2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em]">Ambient Worship</p>
            <WaveformGraphic variant="blue" active={playing} />
          </div>
          <button
            type="button"
            onClick={() => {
              void togglePlayback();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition hover:scale-105 hover:border-[#00E6FF]/60"
            aria-label={playing ? "Pause ambient worship" : "Play ambient worship"}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-[max(1.35rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 text-center">
          <Image
            src={AWAKENING_ASSETS.ui.neonChevron}
            alt=""
            width={20}
            height={14}
            style={{ width: "1.25rem", height: "auto" }}
            className="mx-auto object-contain"
            aria-hidden="true"
          />
          <p className="mt-1 font-ui text-[0.58rem] font-bold uppercase tracking-[0.24em] text-white/50">
            TAP AN ORB TO EXPLORE
          </p>
        </div>
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
