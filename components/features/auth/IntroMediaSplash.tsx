"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AccessContext } from "@/lib/access";
import { fetchAccessContext } from "@/lib/access";
import { buildPersonaHubUrl, DEFAULT_ATTENDEE_NEXT } from "@/lib/auth/routing";
import IntroEnterButton from "@/components/features/intro/IntroEnterButton";
import {
  INTRO_BG_LOOP_DESKTOP,
  INTRO_BG_LOOP_MOBILE,
} from "@/lib/features/intro/intro-assets";

const EXIT_MS = 520;
const ACCESS_TIMEOUT_MS = 600;
const MOBILE_BREAKPOINT = "(max-width: 767px)";

function resolveIntroVideoSrc(): string {
  if (typeof window === "undefined") return INTRO_BG_LOOP_MOBILE;
  return window.matchMedia(MOBILE_BREAKPOINT).matches
    ? INTRO_BG_LOOP_MOBILE
    : INTRO_BG_LOOP_DESKTOP;
}

async function resolveIntroDestination(): Promise<string> {
  try {
    const context = await Promise.race<AccessContext>([
      fetchAccessContext(),
      new Promise((resolve) => {
        window.setTimeout(
          () => resolve({ userId: null, email: null, isGuest: false }),
          ACCESS_TIMEOUT_MS,
        );
      }),
    ]);

    return context.userId
      ? DEFAULT_ATTENDEE_NEXT
      : buildPersonaHubUrl(DEFAULT_ATTENDEE_NEXT);
  } catch {
    return buildPersonaHubUrl(DEFAULT_ATTENDEE_NEXT);
  }
}

export default function IntroMediaSplash() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isNavigatingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState(INTRO_BG_LOOP_MOBILE);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const syncVideoSrc = () => setVideoSrc(resolveIntroVideoSrc());

    syncVideoSrc();
    mediaQuery.addEventListener("change", syncVideoSrc);
    return () => mediaQuery.removeEventListener("change", syncVideoSrc);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setVideoReady(false);

    const tryPlay = () => {
      void video.play().catch(() => {
        /* Autoplay may require a gesture on strict mobile policies. */
      });
    };

    const onReady = () => {
      setVideoReady(true);
      tryPlay();
    };

    video.src = videoSrc;
    video.load();

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      onReady();
    }

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);

    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
    };
  }, [videoSrc]);

  const stopIntroVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  const navigateAway = useCallback(
    (destination: string) => {
      stopIntroVideo();

      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        window.location.assign(destination);
        return;
      }

      window.setTimeout(() => {
        window.location.assign(destination);
      }, EXIT_MS);
    },
    [stopIntroVideo],
  );

  const handleEnter = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsExiting(true);

    void resolveIntroDestination()
      .then(navigateAway)
      .catch(() => navigateAway(buildPersonaHubUrl(DEFAULT_ATTENDEE_NEXT)));
  }, [navigateAway]);

  return (
    <div
      className={`intro-media-splash fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-slate-950 transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        key={videoSrc}
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      {!videoReady ? (
        <div
          className="pointer-events-none absolute inset-0 bg-slate-950"
          aria-hidden="true"
        />
      ) : null}

      <IntroEnterButton onClick={handleEnter} disabled={isExiting} />
    </div>
  );
}
