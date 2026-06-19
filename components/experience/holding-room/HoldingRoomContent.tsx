"use client";

import type { CSSProperties } from "react";
import {
  HOLDING_ROOM_CONTENT_SLOTS,
  HOLDING_ROOM_CONTENT_INSET,
} from "@/lib/experience/holding-room-assets";
import type { CountdownParts } from "@/lib/live/event-lobby";

type HoldingRoomContentProps = {
  countdown: CountdownParts;
  showCountdown: boolean;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function slotStyle(
  slot: (typeof HOLDING_ROOM_CONTENT_SLOTS)[keyof typeof HOLDING_ROOM_CONTENT_SLOTS],
): CSSProperties {
  return {
    left: `${slot.left * 100}%`,
    top: `${slot.top * 100}%`,
    width: `${slot.width * 100}%`,
    height: `${slot.height * 100}%`,
  };
}

function insetStyle(
  inset: (typeof HOLDING_ROOM_CONTENT_INSET)[keyof typeof HOLDING_ROOM_CONTENT_INSET],
): CSSProperties {
  return {
    left: `${inset.x * 100}%`,
    top: `${inset.y * 100}%`,
    width: `${inset.w * 100}%`,
    height: `${inset.h * 100}%`,
  };
}

export default function HoldingRoomContent({
  countdown,
  showCountdown,
}: HoldingRoomContentProps) {
  const segments = [
    { value: pad(countdown.days), label: "DAYS" },
    { value: pad(countdown.hours), label: "HOURS" },
    { value: pad(countdown.minutes), label: "MINUTES" },
    { value: pad(countdown.seconds), label: "SECONDS" },
  ];

  if (!showCountdown || countdown.isComplete) {
    return null;
  }

  return (
    <div
      className="holding-room-page__content holding-room-page__content--countdown"
      style={slotStyle(HOLDING_ROOM_CONTENT_SLOTS.countdown)}
      aria-live="polite"
      aria-label="Event countdown"
    >
      <div
        className="holding-room-page__countdown-values"
        style={insetStyle(HOLDING_ROOM_CONTENT_INSET.countdown)}
      >
        <div className="holding-room-page__countdown-grid">
          {segments.map((segment) => (
            <div key={segment.label} className="holding-room-page__countdown-cell">
              <span className="holding-room-page__countdown-value font-headline">
                {segment.value}
              </span>
              <span className="holding-room-page__countdown-label font-ui">
                {segment.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
