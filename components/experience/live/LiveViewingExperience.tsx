"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import AttendeeStreamPlayer from "@/components/experience/live/AttendeeStreamPlayer";
import ExperienceSelector from "@/components/experience/live/ExperienceSelector";
import FloatingLiveReactions from "@/components/experience/live/FloatingLiveReactions";
import StreamStageChrome from "@/components/experience/live/StreamStageChrome";
import {
  DEFAULT_ATTENDEE_EXPERIENCE,
  EXPERIENCE_UNAVAILABLE_COPY,
  type AttendeeExperienceKey,
} from "@/lib/experience/stream-experiences";
import { useAttendeeStreamExperiences } from "@/lib/experience/useAttendeeStreamExperiences";

type LiveViewingExperienceProps = {
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
};

export default function LiveViewingExperience({
  showPaywall,
  paywallOverlay,
}: LiveViewingExperienceProps) {
  const { feeds, showSelector } = useAttendeeStreamExperiences(true);
  const [selectedExperience, setSelectedExperience] =
    useState<AttendeeExperienceKey>(DEFAULT_ATTENDEE_EXPERIENCE);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackNotice = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setFallbackNotice(null);
  }, []);

  const showFallbackNotice = useCallback(() => {
    setFallbackNotice(EXPERIENCE_UNAVAILABLE_COPY);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      setFallbackNotice(null);
      fallbackTimerRef.current = null;
    }, 6_000);
  }, []);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (feeds.length === 0) return;
    const stillAvailable = feeds.some((feed) => feed.key === selectedExperience);
    if (!stillAvailable) {
      setSelectedExperience(DEFAULT_ATTENDEE_EXPERIENCE);
      showFallbackNotice();
    }
  }, [feeds, selectedExperience, showFallbackNotice]);

  const handleSelect = useCallback(
    (key: AttendeeExperienceKey) => {
      clearFallbackNotice();
      setSelectedExperience(key);
    },
    [clearFallbackNotice],
  );

  const handleExperienceUnavailable = useCallback(
    (requested: AttendeeExperienceKey) => {
      if (requested === DEFAULT_ATTENDEE_EXPERIENCE) return;
      setSelectedExperience(DEFAULT_ATTENDEE_EXPERIENCE);
      showFallbackNotice();
    },
    [showFallbackNotice],
  );

  return (
    <div className="relative flex w-full min-w-0 max-w-full flex-col gap-2 md:gap-3">
      <div className="experience-stream-stage relative w-full min-w-0 shrink-0 overflow-hidden rounded-none md:rounded-xl">
        <FloatingLiveReactions />
        <StreamStageChrome isLive />
        <AttendeeStreamPlayer
          key={selectedExperience}
          experience={selectedExperience}
          enabled
          showPaywall={showPaywall}
          paywallOverlay={paywallOverlay}
          onExperienceUnavailable={handleExperienceUnavailable}
          embedded
        />
      </div>

      <div className="experience-live-interactive flex w-full min-w-0 max-w-full shrink-0 flex-col gap-2 md:gap-3">
        {showSelector ? (
          <ExperienceSelector
            feeds={feeds}
            selectedKey={selectedExperience}
            onSelect={handleSelect}
          />
        ) : null}

        {fallbackNotice ? (
          <p className="font-body text-xs leading-relaxed text-zinc-400" role="status">
            {fallbackNotice}
          </p>
        ) : null}
      </div>
    </div>
  );
}
