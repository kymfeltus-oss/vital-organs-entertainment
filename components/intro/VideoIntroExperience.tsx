"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import IntroAmbientFxLayer from "@/components/intro/IntroAmbientFxLayer";
import { fetchAccessContext } from "@/lib/access";
import { buildPersonaHubUrl, DEFAULT_ATTENDEE_NEXT } from "@/lib/auth/routing";

const INTRO_IMAGE_SRC = "/mobile%20intro.png";
const INTRO_MUSIC_SRC = "/intro-music.m4a";
const EXIT_MS = 520;

export default function VideoIntroExperience() {
  const router = useRouter();
  const musicRef = useRef<HTMLAudioElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
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

  const stopIntroMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const engageIntroMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return;

    audio.volume = 1;
    void audio.play().catch(() => {
      /* Autoplay may require the enter tap — navigation still proceeds. */
    });
  }, []);

  useEffect(() => {
    return () => {
      stopIntroMusic();
    };
  }, [stopIntroMusic]);

  const handleEnter = useCallback(async () => {
    if (isNavigating) return;

    engageIntroMusic();
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
    <div
      className={`intro-flash-root fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-brand-black transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="intro-flash-ambience intro-flash-ambience--back" aria-hidden="true">
        <div className="intro-flash-vignette" />
      </div>

      <div className="intro-flash-stage" aria-hidden="true">
        <div className="intro-flash-motion">
          <div className="intro-flash-frame">
            <img
              src={INTRO_IMAGE_SRC}
              alt=""
              decoding="async"
              fetchPriority="high"
              className="intro-flash-art"
            />
          </div>
        </div>
      </div>

      <IntroAmbientFxLayer />

      <audio
        ref={musicRef}
        src={INTRO_MUSIC_SRC}
        loop
        preload="auto"
        aria-hidden="true"
        className="sr-only"
      />

      <button
        type="button"
        onClick={() => void handleEnter()}
        disabled={isNavigating}
        aria-label="Let's get awakened — enter experience"
        className="intro-flash-enter-hit"
      />
    </div>
  );
}
