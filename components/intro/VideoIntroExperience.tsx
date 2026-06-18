"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AccessContext } from "@/lib/access";
import { fetchAccessContext } from "@/lib/access";
import { buildPersonaHubUrl, DEFAULT_ATTENDEE_NEXT } from "@/lib/auth/routing";
import {
  INTRO_ENTER_PANEL,
  INTRO_MOBILE_ART,
  INTRO_MUSIC_SRC,
  INTRO_VIDEO_SRC,
} from "@/lib/experience/intro-assets";
import { introRectStyle } from "@/lib/experience/intro-layout-slots";

const EXIT_MS = 520;
const ACCESS_TIMEOUT_MS = 600;

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

export default function VideoIntroExperience() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const isNavigatingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [artSize, setArtSize] = useState<{ width: number; height: number }>(INTRO_MOBILE_ART);

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

    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";

    const tryPlay = () => {
      void video.play().catch(() => {
        /* Autoplay may require user gesture — enter tap will start playback. */
      });
    };

    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setArtSize({ width: video.videoWidth, height: video.videoHeight });
      }
      setVideoReady(true);
      tryPlay();
    };

    if (video.readyState >= 2) {
      onReady();
    }

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("loadedmetadata", onReady);

    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("loadedmetadata", onReady);
    };
  }, []);

  const stopIntroVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  const stopIntroMusic = useCallback(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const playIntroMusic = useCallback(async () => {
    const audio = musicRef.current;
    if (!audio) return;

    audio.volume = 0.85;

    try {
      if (audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        audio.load();
      }
      if (audio.paused) {
        await audio.play();
      }
    } catch {
      /* Browser autoplay policy — unlocks on first tap. */
    }
  }, []);

  useEffect(() => {
    void playIntroMusic();

    const unlockOnGesture = () => {
      void playIntroMusic();
    };

    window.addEventListener("pointerdown", unlockOnGesture, { passive: true });
    window.addEventListener("keydown", unlockOnGesture, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlockOnGesture);
      window.removeEventListener("keydown", unlockOnGesture);
    };
  }, [playIntroMusic]);

  useEffect(() => {
    return () => {
      stopIntroVideo();
      stopIntroMusic();
    };
  }, [stopIntroVideo, stopIntroMusic]);

  const handleEnter = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    setIsExiting(true);

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const navigate = (destination: string) => {
      stopIntroMusic();
      stopIntroVideo();

      if (reducedMotion) {
        window.location.assign(destination);
        return;
      }

      window.setTimeout(() => {
        window.location.assign(destination);
      }, EXIT_MS);
    };

    void resolveIntroDestination()
      .then(navigate)
      .catch(() => navigate(buildPersonaHubUrl(DEFAULT_ATTENDEE_NEXT)));
  }, [stopIntroMusic, stopIntroVideo]);

  return (
    <div
      className={`intro-flash-root fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-brand-black transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      onPointerDown={() => void playIntroMusic()}
    >
      <audio
        ref={musicRef}
        src={INTRO_MUSIC_SRC}
        loop
        preload="auto"
        className="intro-flash-audio"
        aria-hidden="true"
      />

      <div className="intro-flash-ambience intro-flash-ambience--back" aria-hidden="true">
        <div className="intro-flash-vignette" />
      </div>

      <div className="intro-flash-stage">
        <div
          className="intro-flash-artboard"
          style={{
            aspectRatio: `${artSize.width} / ${artSize.height}`,
            ["--intro-art-w" as string]: String(artSize.width),
            ["--intro-art-h" as string]: String(artSize.height),
          }}
        >
          <video
            ref={videoRef}
            src={INTRO_VIDEO_SRC}
            className="intro-flash-artboard__video"
            width={artSize.width}
            height={artSize.height}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />

          {!videoReady ? (
            <div className="intro-flash-video-loading" aria-hidden="true">
              <span className="intro-flash-video-loading-bar" />
            </div>
          ) : null}

          <div className="intro-flash-overlay">
            <button
              type="button"
              onClick={handleEnter}
              aria-label="Let's get awakened — enter experience"
              className="intro-flash-enter-hit"
              style={introRectStyle(INTRO_ENTER_PANEL)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
