"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const AUDIO_SRC = "/audio/Video%20Project%206.m4a";
const PLAYBACK_RATE = 0.9;
const ENTER_REVEAL_MS = 1_500;
const VIDEO_FALLBACK_MS = 12_000;

export default function AwakeningLaunch() {
  const router = useRouter();
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [showEnter, setShowEnter] = useState(false);

  const routeToDestination = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    if (fallbackRef.current !== null) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = null;
    }

    audioRef.current?.pause();

    const savedEmail = localStorage.getItem("awakening_user_email");

    if (savedEmail) {
      router.replace("/dashboard/live");
    } else {
      router.replace("/email-gate");
    }
  }, [router]);

  const startIntroAudio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.paused) return;

    try {
      audio.volume = 0.85;
      audio.playbackRate = PLAYBACK_RATE;
      await audio.play();
    } catch {
      /* Autoplay blocked — retried on first tap */
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = PLAYBACK_RATE;
    }

    void startIntroAudio();

    const enterRevealTimer = setTimeout(() => setShowEnter(true), ENTER_REVEAL_MS);
    fallbackRef.current = setTimeout(routeToDestination, VIDEO_FALLBACK_MS);

    return () => {
      clearTimeout(enterRevealTimer);

      if (fallbackRef.current !== null) {
        clearTimeout(fallbackRef.current);
      }
    };
  }, [routeToDestination, startIntroAudio]);

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

  const handleVideoEnded = useCallback(() => {
    routeToDestination();
  }, [routeToDestination]);

  const handleScreenTap = useCallback(() => {
    void startIntroAudio();
  }, [startIntroAudio]);

  const handleEnter = useCallback(() => {
    routeToDestination();
  }, [routeToDestination]);

  return (
    <main className="fixed inset-0 z-0 flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        src="/intro-video.mp4"
        autoPlay
        muted
        playsInline
        onLoadedMetadata={applyVideoPlaybackRate}
        onEnded={handleVideoEnded}
      />

      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        loop
        preload="auto"
        autoPlay
        onLoadedMetadata={applyAudioPlaybackRate}
        className="hidden"
      />

      <button
        type="button"
        aria-label="Tap to start intro audio if blocked"
        onClick={handleScreenTap}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer"
      />

      {showEnter && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-6 pb-[12%] pb-safe">
          <button
            type="button"
            aria-label="Enter the experience"
            onClick={handleEnter}
            className="pointer-events-auto h-16 w-full max-w-[280px] rounded-full opacity-0"
          />
        </div>
      )}
    </main>
  );
}
