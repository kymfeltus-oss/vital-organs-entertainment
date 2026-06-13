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
      className={`fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-brand-black transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      aria-label="300 Awakening intro"
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
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      />

      {!videoReady ? (
        <div className="absolute inset-0 bg-brand-black" aria-hidden="true" />
      ) : null}

      <div
        className={`absolute bottom-[max(3rem,env(safe-area-inset-bottom))] left-1/2 z-10 -translate-x-1/2 transition-opacity duration-500 ${
          isExiting ? "opacity-0" : "opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={() => void handleEnterHub()}
          disabled={isNavigating}
          className="brand-gradient-border touch-target flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-transparent px-10 py-3 font-ui text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_20px_rgba(0,168,255,0.28)] transition duration-300 hover:shadow-[0_0_32px_rgba(0,168,255,0.5),0_0_14px_rgba(255,0,140,0.22)] active:scale-[0.98] disabled:opacity-60 [background:linear-gradient(transparent,transparent)_padding-box,var(--gradient-brand)_border-box]"
        >
          Enter Hub
        </button>
      </div>
    </div>
  );
}
