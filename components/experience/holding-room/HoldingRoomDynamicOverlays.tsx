"use client";

import type { CSSProperties } from "react";
import {
  HOLDING_ROOM_ASSETS,
  HOLDING_ROOM_FRAME_INSET,
  HOLDING_ROOM_OVERLAY_SLOTS,
} from "@/lib/experience/holding-room-assets";
import {
  formatHoldingRoomEventDate,
  formatHoldingRoomEventTime,
} from "@/lib/experience/holding-room-schedule";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

type HoldingRoomDynamicOverlaysProps = {
  config: EventCountdownConfig;
  countdown: CountdownParts;
  showCountdown: boolean;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function slotStyle(
  slot: (typeof HOLDING_ROOM_OVERLAY_SLOTS)[keyof typeof HOLDING_ROOM_OVERLAY_SLOTS],
): CSSProperties {
  return {
    left: `${slot.left * 100}%`,
    top: `${slot.top * 100}%`,
    width: `${slot.width * 100}%`,
    height: `${slot.height * 100}%`,
  };
}

function insetStyle(
  inset: (typeof HOLDING_ROOM_FRAME_INSET)[keyof typeof HOLDING_ROOM_FRAME_INSET],
): CSSProperties {
  return {
    left: `${inset.x * 100}%`,
    top: `${inset.y * 100}%`,
    width: `${inset.w * 100}%`,
    height: `${inset.h * 100}%`,
  };
}

export default function HoldingRoomDynamicOverlays({
  config,
  countdown,
  showCountdown,
}: HoldingRoomDynamicOverlaysProps) {
  const segments = [
    { value: pad(countdown.days), label: "DAYS" },
    { value: pad(countdown.hours), label: "HOURS" },
    { value: pad(countdown.minutes), label: "MINUTES" },
    { value: pad(countdown.seconds), label: "SECONDS" },
  ];

  const eventDate = formatHoldingRoomEventDate(config.start_time);
  const eventTime = formatHoldingRoomEventTime(config.start_time);

  return (
    <>
      {/* Layer 2 — countdown frame */}
      <div
        className="holding-room-page__slot holding-room-page__slot--countdown-frame"
        style={slotStyle(HOLDING_ROOM_OVERLAY_SLOTS.countdown)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOLDING_ROOM_ASSETS.countdownFrame}
          alt=""
          className="holding-room-page__frame-img"
          draggable={false}
        />

        {/* Layer 3 — countdown values + labels */}
        {showCountdown && !countdown.isComplete ? (
          <div
            className="holding-room-page__countdown-values"
            style={insetStyle(HOLDING_ROOM_FRAME_INSET.countdown)}
            aria-live="polite"
            aria-label="Event countdown"
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
        ) : null}
      </div>

      {/* Layer 4 — live indicator pill */}
      <div
        className="holding-room-page__slot holding-room-page__slot--live-pill"
        style={slotStyle(HOLDING_ROOM_OVERLAY_SLOTS.livePill)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOLDING_ROOM_ASSETS.livePill}
          alt=""
          className="holding-room-page__frame-img"
          draggable={false}
        />
      </div>

      {/* Layer 5 — datetime frame */}
      <div
        className="holding-room-page__slot holding-room-page__slot--datetime-frame"
        style={slotStyle(HOLDING_ROOM_OVERLAY_SLOTS.datetime)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOLDING_ROOM_ASSETS.datetimeFrame}
          alt=""
          className="holding-room-page__frame-img"
          draggable={false}
        />

        {/* Layer 6 — dynamic date / time */}
        <div
          className="holding-room-page__datetime-values"
          style={insetStyle(HOLDING_ROOM_FRAME_INSET.datetime)}
        >
          <span className="holding-room-page__datetime-date font-ui">{eventDate}</span>
          <span className="holding-room-page__datetime-time font-ui">{eventTime}</span>
        </div>
      </div>
    </>
  );
}
