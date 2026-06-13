"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAccessContext } from "@/lib/access";
import { buildPersonaHubUrl, DEFAULT_ATTENDEE_NEXT } from "@/lib/auth/routing";

const INTRO_VIDEO_SRC = "/intro-video.mp4";
const EXIT_MS = 520;

export default function VideoIntroExperience() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
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
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
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
  }, []);

  const handleContinue = useCallback(async () => {
    if (isNavigating) return;
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
  }, [isNavigating, router]);

  return (
    <button
      type="button"
      onClick={() => void handleContinue()}
      disabled={isNavigating}
      aria-label="Continue to 300 Awakening experience"
      className={`fixed inset-0 z-50 block h-dvh w-full cursor-pointer overflow-hidden border-0 bg-brand-black p-0 transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <video
        ref={videoRef}
        src={INTRO_VIDEO_SRC}
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

      {!videoReady ? (
        <span className="pointer-events-none absolute inset-0 block bg-brand-black" aria-hidden="true" />
      ) : null}
    </button>
  );
}
