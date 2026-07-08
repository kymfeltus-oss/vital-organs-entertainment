"use client";

import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { markColemanSessionEntered } from "@/app/enterprise/coleman/lib/intro-session";
import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

const INTRO_VIDEO_SRC = "/enterprise/coleman/coleman_intro.mp4";

export default function ColemanIntroFlash() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [soundBlocked, setSoundBlocked] = useState(false);

  const enableSound = useCallback(async () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = false;
    video.volume = 1;

    try {
      await video.play();
      setIsMuted(false);
      setSoundBlocked(false);
    } catch {
      video.muted = true;
      setIsMuted(true);
    }
  }, []);

  const handleEnter = useCallback(() => {
    markColemanSessionEntered();
    void enableSound();
  }, [enableSound]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    const start = async () => {
      video.muted = false;
      video.volume = 1;

      try {
        await video.play();
        setIsMuted(false);
        setSoundBlocked(false);
      } catch {
        video.muted = true;
        setIsMuted(true);
        setSoundBlocked(true);

        try {
          await video.play();
        } catch {
          // User must tap to unlock playback.
        }
      }
    };

    void start();
    return undefined;
  }, []);

  return (
    <div className="coleman-intro-root">
      <video
        ref={videoRef}
        className="coleman-intro-video"
        src={INTRO_VIDEO_SRC}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        aria-hidden
      />

      {soundBlocked ? (
        <button
          type="button"
          className="coleman-sound-chip"
          onClick={(e) => {
            e.stopPropagation();
            void enableSound();
          }}
        >
          {isMuted ? (
            <>
              <VolumeX size={14} strokeWidth={1.25} />
              TAP FOR SOUND
            </>
          ) : (
            <>
              <Volume2 size={14} strokeWidth={1.25} />
              SOUND ON
            </>
          )}
        </button>
      ) : null}

      <Link
        href={COLEMAN_ROUTES.home}
        prefetch
        scroll={false}
        className="coleman-intro-enter-layer"
        aria-label="Enter dashboard"
        onClick={handleEnter}
      />
    </div>
  );
}
