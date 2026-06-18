"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import IntroAmbientFxLayer from "@/components/intro/IntroAmbientFxLayer";
import { fetchAccessContext } from "@/lib/access";
import { buildPersonaHubUrl, DEFAULT_ATTENDEE_NEXT } from "@/lib/auth/routing";

const INTRO_VIDEO_SRC = "/intro%20mobile.mp4";
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

    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "auto";

    const tryPlay = () => {
      void video.play().catch(() => {
        /* Autoplay may require user gesture — enter tap will start playback. */
      });
    };

    if (video.readyState >= 2) {
      setVideoReady(true);
      tryPlay();
      return;
    }

    const onReady = () => {
      setVideoReady(true);
      tryPlay();
    };

    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);

    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
    };
  }, []);

  const stopIntroVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  const engageIntroVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;
    void video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => {});
    });
  }, []);

  useEffect(() => {
    return () => {
      stopIntroVideo();
    };
  }, [stopIntroVideo]);

  const handleEnter = useCallback(async () => {
    if (isNavigating) return;

    engageIntroVideo();
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
  }, [engageIntroVideo, isNavigating, router]);

  return (
    <div
      className={`intro-flash-root fixed inset-0 z-50 h-dvh w-full overflow-hidden bg-brand-black transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="intro-flash-ambience intro-flash-ambience--back" aria-hidden="true">
        <div className="intro-flash-vignette" />
      </div>

      <div className="intro-flash-stage">
        <div className="intro-flash-frame intro-flash-frame--video">
          <video
            ref={videoRef}
            src={INTRO_VIDEO_SRC}
            className="intro-flash-art intro-flash-video"
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
        </div>
      </div>

      <IntroAmbientFxLayer />

      <button
        type="button"
        onClick={() => void handleEnter()}
        disabled={isNavigating}
        aria-label="Let's get awakened — enter experience"
        className="intro-flash-enter-hit touch-target"
      />
    </div>
  );
}
