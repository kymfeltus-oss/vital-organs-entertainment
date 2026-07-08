"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type ColemanIntroFlashProps = {
  onEnter: () => void;
};

export default function ColemanIntroFlash({ onEnter }: ColemanIntroFlashProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [soundBlocked, setSoundBlocked] = useState(false);

  const enableSound = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
          // Still blocked — user must tap to play.
        }
      }
    };

    start();
    const timer = window.setTimeout(() => setVisible(true), 600);
    return () => window.clearTimeout(timer);
  }, []);

  const handleIntroTap = async () => {
    if (isMuted) {
      await enableSound();
    }
  };

  const handleEnter = async () => {
    if (isMuted) {
      await enableSound();
    }
    onEnter();
  };

  return (
    <div
      className="coleman-intro-root coleman-luxury-canvas"
      onClick={handleIntroTap}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleIntroTap();
      }}
      role="presentation"
    >
      <video
        ref={videoRef}
        className="coleman-intro-video"
        src="/enterprise/coleman/coleman_intro.mp4"
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
      />

      <div className="coleman-intro-overlay" aria-hidden />

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

      <div className="coleman-intro-content">
        <div
          className={`coleman-intro-enter-wrap${visible ? " is-visible" : ""}`}
        >
          <button
            type="button"
            className="coleman-intro-enter-btn"
            onClick={(e) => {
              e.stopPropagation();
              void handleEnter();
            }}
          >
            <span className="coleman-intro-enter-label">ENTER</span>
            <span className="coleman-intro-enter-icon" aria-hidden>
              →
            </span>
          </button>
          <p className="coleman-intro-enter-hint">
            {isMuted ? "Tap anywhere for sound · Enter for dashboard" : "Tap to open your dashboard"}
          </p>
        </div>
      </div>
    </div>
  );
}
