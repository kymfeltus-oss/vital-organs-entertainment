"use client";

import { useMemo, type CSSProperties } from "react";
import { parseCountdownStartMs } from "@/lib/experience/countdown-display";
import {
  HOLDING_ROOM_COUNTDOWN_UNITS,
  HOLDING_ROOM_COUNTDOWN_VALUE_CLASS,
  type HoldingRoomCountdownSlot,
  type HoldingRoomCountdownUnitId,
} from "@/lib/experience/holding-room-countdown-slots";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";

type HoldingRoomCountdownOverlayProps = {
  initialCountdownConfig?: EventCountdownConfig;
};

function anchorStyle(
  slot: HoldingRoomCountdownSlot,
  yKey: "digitY" | "labelY",
): CSSProperties {
  return {
    left: `${slot.centerX}%`,
    top: `${slot[yKey]}%`,
    transform: "translate(-50%, -50%)",
  };
}

function pad(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

function resolveUnitValues(
  unit: HoldingRoomCountdownUnitId,
  countdown: ReturnType<typeof useLobbyCountdown>["countdown"],
): string {
  switch (unit) {
    case "days":
      return pad(countdown.days);
    case "hours":
      return pad(countdown.hours);
    case "minutes":
      return pad(countdown.minutes);
    case "seconds":
      return pad(countdown.seconds);
    default:
      return "00";
  }
}

export default function HoldingRoomCountdownOverlay({
  initialCountdownConfig,
}: HoldingRoomCountdownOverlayProps) {
  const { config, countdown, isLoading } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
  });

  const hasStartTime = parseCountdownStartMs(config.start_time) !== null;

  const values = useMemo(
    () =>
      Object.fromEntries(
        HOLDING_ROOM_COUNTDOWN_UNITS.map((unit) => [
          unit.id,
          resolveUnitValues(unit.id, countdown),
        ]),
      ) as Record<HoldingRoomCountdownUnitId, string>,
    [countdown],
  );

  const ariaLabel = useMemo(() => {
    if (!hasStartTime || isLoading) return "Loading event countdown";
    if (countdown.isComplete) return "Event starting now";
    return `${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds until live`;
  }, [countdown, hasStartTime, isLoading]);

  if (!hasStartTime) {
    return null;
  }

  return (
    <div
      className="holding-room-countdown"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      {HOLDING_ROOM_COUNTDOWN_UNITS.map((unit) => (
        <div key={unit.id} className="holding-room-countdown__unit">
          <div
            className={`holding-room-countdown__value font-headline ${HOLDING_ROOM_COUNTDOWN_VALUE_CLASS[unit.id]}`}
            style={anchorStyle(unit, "digitY")}
          >
            {isLoading ? "00" : values[unit.id]}
          </div>
          <div
            className="holding-room-countdown__label font-ui"
            style={anchorStyle(unit, "labelY")}
            aria-hidden="true"
          >
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
}
