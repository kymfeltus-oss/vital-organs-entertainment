"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchAccessContext } from "@/lib/access";
import { buildPersonaHubUrl, DEFAULT_ATTENDEE_NEXT } from "@/lib/auth/routing";

const INTRO_IMAGE_DESKTOP = "/desktop%20intro.png";
const INTRO_IMAGE_MOBILE = "/mobile%20intro.png";
const INTRO_MUSIC_SRC = "/intro-music.m4a";
const MOBILE_INTRO_MEDIA_QUERY = "(max-width: 767px)";
const EXIT_MS = 520;

const INTRO_SPARK_COUNT = 10;

type IntroViewport = "mobile" | "desktop";

function pickIntroViewport(): IntroViewport {
  if (typeof window === "undefined") return "mobile";
  return window.matchMedia(MOBILE_INTRO_MEDIA_QUERY).matches ? "mobile" : "desktop";
}

export default function VideoIntroExperience() {
  const router = useRouter();
  const musicRef = useRef<HTMLAudioElement>(null);
  const [viewport, setViewport] = useState<IntroViewport>("mobile");
  const [imageSrc, setImageSrc] = useState(INTRO_IMAGE_MOBILE);
  const [isExiting, setIsExiting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_INTRO_MEDIA_QUERY);

    const syncIntroSurface = () => {
      const nextViewport = pickIntroViewport();
      setViewport(nextViewport);
      setImageSrc(nextViewport === "mobile" ? INTRO_IMAGE_MOBILE : INTRO_IMAGE_DESKTOP);
    };

    syncIntroSurface();
    mediaQuery.addEventListener("change", syncIntroSurface);

    return () => {
      mediaQuery.removeEventListener("change", syncIntroSurface);
    };
  }, []);

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

  const handleImageError = useCallback(() => {
    setImageSrc((current) =>
      current === INTRO_IMAGE_DESKTOP ? INTRO_IMAGE_MOBILE : current,
    );
  }, []);

  return (
    <div
      className={`intro-flash-root fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-brand-black transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="intro-flash-ambience" aria-hidden="true">
        <div className="intro-flash-orb intro-flash-orb--blue" />
        <div className="intro-flash-orb intro-flash-orb--pink" />
        <div className="intro-flash-orb intro-flash-orb--indigo" />
        <div className="intro-flash-sparkfield">
          {Array.from({ length: INTRO_SPARK_COUNT }, (_, index) => (
            <span
              key={index}
              className={`intro-flash-particle intro-flash-particle--${index}`}
            />
          ))}
        </div>
        <div className="intro-flash-vignette" />
      </div>

      <div className="intro-flash-stage" aria-hidden="true">
        <div
          className={`intro-flash-motion intro-flash-motion--${viewport}`}
        >
          <img
            key={imageSrc}
            src={imageSrc}
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={handleImageError}
            className={`intro-flash-art intro-flash-art--${viewport}`}
          />
        </div>
      </div>

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
        className={`intro-flash-enter-hit intro-flash-enter-hit--${viewport}`}
      />
    </div>
  );
}
