"use client";

import { useMemo } from "react";

import KeyFinderLiveSync from "@/app/enterprise/coleman/components/home/KeyFinderLiveSync";
import { liveFallback } from "@/app/enterprise/coleman/lib/live-display";

type KeyFinderLiveAnnouncerProps = {
  currentKey: string | null;
  keyQuality: string | null;
};

function buildAnnouncement(currentKey: string | null, keyQuality: string | null): string {
  const key = liveFallback(currentKey);
  const quality = liveFallback(keyQuality);
  if (key === "—") {
    return "No key detected";
  }
  if (quality !== "—") {
    return `Current key ${key}, ${quality}`;
  }
  return `Current key ${key}`;
}

/** Client bridge: updates the persistent SSR live region when pitch state changes. */
export default function KeyFinderLiveAnnouncer({
  currentKey,
  keyQuality,
}: KeyFinderLiveAnnouncerProps) {
  const announcement = useMemo(
    () => buildAnnouncement(currentKey, keyQuality),
    [currentKey, keyQuality],
  );

  return <KeyFinderLiveSync announcement={announcement} />;
}
