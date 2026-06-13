"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAccessContext } from "@/lib/access";
import { buildPersonaHubUrl, DEFAULT_ATTENDEE_NEXT } from "@/lib/auth/routing";

const INTRO_VIDEO_DESKTOP = "/intro-video.mp4";
const INTRO_VIDEO_MOBILE = "/intro-video%20mobile.mp4";
/** Drop soundtrack at public/intro-music.mp3 — video tracks stay silent. */
const INTRO_MUSIC_SRC = "/intro-music.mp3";
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

export default function VideoIntroExperience() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const musicUnlockedRef = useRef(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
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
  }, []);

  const tryStartIntroMusic = useCallback(() => {
    if (musicUnlockedRef.current) return;

    const audio = musicRef.current;
    if (!audio) return;

    void audio.play().then(() => {
      musicUnlockedRef.current = true;
    }).catch(() => {
      /* Browsers may block audio until user gesture — unlocked on tap. */
    });
  }, []);

  useEffect(() => {
    if (!videoReady) return;
    tryStartIntroMusic();
  }, [tryStartIntroMusic, videoReady]);

  useEffect(() => {
    return () => {
      stopIntroMusic();
    };
  }, [stopIntroMusic]);

  const handleContinue = useCallback(async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    stopIntroMusic();

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
  }, [isNavigating, router, stopIntroMusic]);

  return (
    <button
      type="button"
      onClick={() => void handleContinue()}
      onPointerDown={() => tryStartIntroMusic()}
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
          defaultMuted
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
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />

      {!videoReady ? (
        <span className="pointer-events-none absolute inset-0 block bg-brand-black" aria-hidden="true" />
      ) : null}
    </button>
  );
}
