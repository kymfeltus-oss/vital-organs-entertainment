"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_ATTENDEE_EXPERIENCE,
  EXPERIENCE_UNAVAILABLE_COPY,
  type AttendeeExperienceKey,
} from "@/lib/experience/stream-experiences";
import { useAttendeeStreamExperiences } from "@/lib/experience/useAttendeeStreamExperiences";

type LiveExperienceStreamContextValue = {
  feeds: ReturnType<typeof useAttendeeStreamExperiences>["feeds"];
  showSelector: boolean;
  selectedExperience: AttendeeExperienceKey;
  setSelectedExperience: (key: AttendeeExperienceKey) => void;
  fallbackNotice: string | null;
  clearFallbackNotice: () => void;
  handleExperienceUnavailable: (requested: AttendeeExperienceKey) => void;
};

const LiveExperienceStreamContext = createContext<LiveExperienceStreamContextValue | null>(
  null,
);

export function LiveExperienceStreamProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const { feeds, showSelector } = useAttendeeStreamExperiences(enabled);
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

  const handleExperienceUnavailable = useCallback(
    (requested: AttendeeExperienceKey) => {
      if (requested === DEFAULT_ATTENDEE_EXPERIENCE) return;
      setSelectedExperience(DEFAULT_ATTENDEE_EXPERIENCE);
      showFallbackNotice();
    },
    [showFallbackNotice],
  );

  const handleSelect = useCallback(
    (key: AttendeeExperienceKey) => {
      clearFallbackNotice();
      setSelectedExperience(key);
    },
    [clearFallbackNotice],
  );

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

  const value = useMemo(
    () => ({
      feeds,
      showSelector,
      selectedExperience,
      setSelectedExperience: handleSelect,
      fallbackNotice,
      clearFallbackNotice,
      handleExperienceUnavailable,
    }),
    [
      clearFallbackNotice,
      fallbackNotice,
      feeds,
      handleExperienceUnavailable,
      handleSelect,
      selectedExperience,
      showSelector,
    ],
  );

  return (
    <LiveExperienceStreamContext.Provider value={value}>
      {children}
    </LiveExperienceStreamContext.Provider>
  );
}

export function useLiveExperienceStream(): LiveExperienceStreamContextValue {
  const context = useContext(LiveExperienceStreamContext);
  if (!context) {
    throw new Error("useLiveExperienceStream must be used within LiveExperienceStreamProvider");
  }
  return context;
}
