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

  const handleEnterHub = useCallback(async () => {
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
    <div
      className={`relative h-dvh min-h-dvh w-full overflow-hidden bg-brand-black transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      aria-label="300 Awakening intro"
    >
      <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-brand-black">
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
          className={`h-full w-full object-cover transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />
        {!videoReady ? (
          <div className="absolute inset-0 bg-brand-black" aria-hidden="true" />
        ) : null}
      </div>

      <div
        className={`pointer-events-none fixed inset-0 z-10 flex items-end justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-safe transition-opacity duration-500 ${
          isExiting ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="glass-panel pointer-events-auto w-full max-w-md rounded-2xl border border-brand-border p-5 shadow-[0_0_48px_rgba(0,168,255,0.12)] sm:p-6">
          <p className="mb-4 text-center font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-blue">
            300 Awakening
          </p>
          <button
            type="button"
            onClick={() => void handleEnterHub()}
            disabled={isNavigating}
            className="brand-gradient-border neon-blue-glow touch-target flex w-full min-h-11 items-center justify-center rounded-xl bg-brand-black px-6 py-3 font-ui text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            Enter Hub
          </button>
        </div>
      </div>
    </div>
  );
}
