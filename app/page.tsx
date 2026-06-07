"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAudio } from "@/app/context/AudioContext";

const RUNTIME_MS = 10_000;

export default function AwakeningLaunch() {
  const router = useRouter();
  const { playTrack } = useAudio();
  const videoRef = useRef<HTMLVideoElement>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitingRef = useRef(false);

  const [started, setStarted] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current !== null) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const exitToEmailGate = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    clearCountdown();
    router.push("/email-gate");
  }, [clearCountdown, router]);

  const syncMedia = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setVideoMuted(false);

    try {
      await Promise.all([playTrack(), video.play()]);
    } catch {
      try {
        await video.play();
      } catch {
        /* autoplay may still be blocked until user gesture */
      }
      await playTrack();
    }
  }, [playTrack]);

  const handleFirstInteraction = useCallback(() => {
    if (started) return;

    setStarted(true);
    setShowEnter(true);
    void syncMedia();

    countdownRef.current = setTimeout(() => {
      exitToEmailGate();
    }, RUNTIME_MS);
  }, [exitToEmailGate, started, syncMedia]);

  const handleEnterClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      exitToEmailGate();
    },
    [exitToEmailGate],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    void video.play().catch(() => {
      /* silent loop until first user tap unlocks full sync */
    });
  }, []);

  useEffect(() => {
    return () => {
      clearCountdown();
    };
  }, [clearCountdown]);

  return (
    <main className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0B090A]">
      <div className="relative h-full w-full max-w-[420px] overflow-hidden bg-black md:max-h-[85vh] md:rounded-[40px] md:border-8 md:border-zinc-800/80 md:shadow-2xl">
        <video
          ref={videoRef}
          src="/intro-video.mp4"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center"
          muted={videoMuted}
          playsInline
          autoPlay
          loop
          preload="auto"
        />

        {!started && (
          <button
            type="button"
            aria-label="Start experience"
            onClick={handleFirstInteraction}
            className="absolute inset-0 z-20 h-full w-full cursor-default border-0 bg-transparent p-0"
          />
        )}

        <div className="relative z-10 flex h-full flex-col justify-between p-6 pb-safe">
          <div aria-hidden="true" />

          {showEnter && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleEnterClick}
                className="rounded-full border border-white/25 bg-white/10 px-10 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/90 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/15 active:scale-[0.98]"
              >
                Enter
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
