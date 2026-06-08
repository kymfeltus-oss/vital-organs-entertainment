"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { fetchAccessContext } from "@/lib/access";

const INTRO_VIDEO_SRC = "/intro-video.mp4";
const INTRO_AUDIO_SRC = "/audio/Video%20Project%206.m4a";
const ENTRY_DURATION_MS = 12_000;
const PLAYBACK_RATE = 0.9;

function resolveNextPath(rawNext: string | null): string {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/dashboard/live";
  }
  return rawNext;
}

function buildEmailGateHref(searchParams: URLSearchParams): string {
  const next = searchParams.get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/email-gate";
  }
  return `/email-gate?next=${encodeURIComponent(next)}`;
}

function EntryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);
  const redirectedRef = useRef(false);

  const [isChecking, setIsChecking] = useState(true);
  const [progress, setProgress] = useState(0);

  const handleIntroComplete = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    audioRef.current?.pause();
    videoRef.current?.pause();
    router.push(buildEmailGateHref(searchParams));
  }, [router, searchParams]);

  const startIntroAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.paused) return;

    try {
      audio.volume = 0.85;
      audio.playbackRate = PLAYBACK_RATE;
      await audio.play();
    } catch {
      /* Autoplay may be blocked until user interaction */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const context = await fetchAccessContext();

      if (cancelled) return;

      if (context.userId) {
        redirectedRef.current = true;
        router.push(resolveNextPath(searchParams.get("next")));
        return;
      }

      setIsChecking(false);
      void startIntroAudio();

      const startedAt = performance.now();

      const tick = (now: number) => {
        if (redirectedRef.current || cancelled) return;

        const elapsed = now - startedAt;
        const nextProgress = Math.min(100, (elapsed / ENTRY_DURATION_MS) * 100);
        setProgress(nextProgress);

        if (elapsed >= ENTRY_DURATION_MS) {
          handleIntroComplete();
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }

    void checkSession();

    return () => {
      cancelled = true;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handleIntroComplete, router, searchParams, startIntroAudio]);

  const applyVideoPlaybackRate = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = PLAYBACK_RATE;
    }
  }, []);

  const applyAudioPlaybackRate = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = PLAYBACK_RATE;
    }
  }, []);

  if (isChecking) {
    return (
      <div className="flex h-dvh w-screen items-center justify-center bg-zinc-950" />
    );
  }

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-zinc-950">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-center"
        src={INTRO_VIDEO_SRC}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={applyVideoPlaybackRate}
        onEnded={handleIntroComplete}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-zinc-950/50"
      />

      <audio
        ref={audioRef}
        src={INTRO_AUDIO_SRC}
        loop
        preload="auto"
        onLoadedMetadata={applyAudioPlaybackRate}
        className="hidden"
      />

      <button
        type="button"
        aria-label="Tap to enable intro audio"
        onClick={() => void startIntroAudio()}
        className="absolute inset-0 z-10"
      />

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-4 px-6 pb-safe">
        <div className="w-full">
          <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#1E40AF] to-[#B0267A]"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleIntroComplete}
          className="mb-4 w-full rounded-2xl bg-gradient-to-r from-[#1E40AF] to-[#B0267A] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_35px_rgba(176,38,122,0.45)]"
        >
          Enter Hub
        </motion.button>
      </div>
    </div>
  );
}

export default function EntryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh w-screen items-center justify-center bg-zinc-950" />
      }
    >
      <EntryPageContent />
    </Suspense>
  );
}
