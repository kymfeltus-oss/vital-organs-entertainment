"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAccessContext } from "@/lib/access";
import { buildPersonaHubUrl, DEFAULT_ATTENDEE_NEXT } from "@/lib/auth/routing";

const INTRO_VIDEO_DESKTOP = "/intro-video.mp4";
const INTRO_VIDEO_MOBILE = "/intro-video%20mobile.mp4";
/** Soundtrack at public/intro-music.m4a — video tracks stay silent. */
const INTRO_MUSIC_SRC = "/intro-music.m4a";
const MOBILE_INTRO_MEDIA_QUERY = "(max-width: 767px)";
const EXIT_MS = 520;

function silenceVideoElement(video: HTMLVideoElement) {
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
}

function pickIntroVideoSrc(): string {
  if (typeof window === "undefined") {
    return INTRO_VIDEO_DESKTOP;
  }

  return window.matchMedia(MOBILE_INTRO_MEDIA_QUERY).matches
    ? INTRO_VIDEO_MOBILE
    : INTRO_VIDEO_DESKTOP;
}

function isMobileIntroViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_INTRO_MEDIA_QUERY).matches;
}

export default function VideoIntroExperience() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const musicEngagedRef = useRef(false);
  const skipContinueOnceRef = useRef(false);
  const isMobileIntroRef = useRef(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    isMobileIntroRef.current = isMobileIntroViewport();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.volume = 1;
    audio.load();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_INTRO_MEDIA_QUERY);

    const syncVideoSrc = () => {
      setVideoReady(false);
      setVideoSrc(pickIntroVideoSrc());
    };

    syncVideoSrc();
    mediaQuery.addEventListener("change", syncVideoSrc);

    return () => {
      mediaQuery.removeEventListener("change", syncVideoSrc);
    };
  }, []);

  useEffect(() => {
    if (!videoSrc) return;

    const video = videoRef.current;
    if (!video) return;

    setVideoReady(false);
    silenceVideoElement(video);
    video.load();

    const tryPlay = () => {
      silenceVideoElement(video);
      void video.play().catch(() => {
        /* Autoplay blocked — muted inline playback should still succeed on retry. */
      });
    };

    const onCanPlay = () => setVideoReady(true);

    if (video.readyState >= 2) {
      tryPlay();
      setVideoReady(true);
    }

    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", onCanPlay);

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", onCanPlay);
    };
  }, [videoSrc]);

  const stopIntroMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    musicEngagedRef.current = false;
  }, []);

  const engageIntroMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return false;

    if (!audio.paused && audio.currentTime > 0) {
      musicEngagedRef.current = true;
      return true;
    }

    audio.volume = 1;

    try {
      const playAttempt = audio.play();
      musicEngagedRef.current = true;
      if (playAttempt) {
        void playAttempt.catch(() => {
          musicEngagedRef.current = false;
        });
      }
      return true;
    } catch {
      musicEngagedRef.current = false;
      return false;
    }
  }, []);

  useEffect(() => {
    if (!videoReady || isMobileIntroRef.current) return;
    engageIntroMusic();
  }, [engageIntroMusic, videoReady]);

  const handleIntroTouchStart = useCallback(() => {
    if (!isMobileIntroRef.current || musicEngagedRef.current) return;

    engageIntroMusic();
    // iOS requires a user gesture for audio; first tap starts music only.
    skipContinueOnceRef.current = true;
  }, [engageIntroMusic]);

  useEffect(() => {
    return () => {
      stopIntroMusic();
    };
  }, [stopIntroMusic]);

  const handleContinue = useCallback(async () => {
    if (isNavigating) return;

    if (skipContinueOnceRef.current) {
      skipContinueOnceRef.current = false;
      return;
    }

    if (isMobileIntroRef.current && !musicEngagedRef.current) {
      engageIntroMusic();
      return;
    }

    setIsNavigating(true);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const context = await fetchAccessContext();
    const destination = context.userId
      ? DEFAULT_ATTENDEE_NEXT
      : buildPersonaHubUrl(DEFAULT_ATTENDEE_NEXT);

    if (reducedMotion) {
      router.push(destination);
      return;
    }

    setIsExiting(true);
    window.setTimeout(() => {
      router.push(destination);
    }, EXIT_MS);
  }, [engageIntroMusic, isNavigating, router]);

  return (
    <button
      type="button"
      onClick={() => void handleContinue()}
      onTouchStart={handleIntroTouchStart}
      disabled={isNavigating}
      aria-label="Continue to 300 Awakening experience"
      className={`fixed inset-0 z-50 block h-dvh w-full cursor-pointer overflow-hidden border-0 bg-brand-black p-0 transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {videoSrc ? (
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          preload="auto"
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : null}

      <audio
        ref={musicRef}
        src={INTRO_MUSIC_SRC}
        loop
        preload="auto"
        aria-hidden="true"
        className="sr-only"
      />

      {!videoReady ? (
        <span className="pointer-events-none absolute inset-0 block bg-brand-black" aria-hidden="true" />
      ) : null}
    </button>
  );
}
