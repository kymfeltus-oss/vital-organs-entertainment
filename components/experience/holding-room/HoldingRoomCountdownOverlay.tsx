"use client";

import { useMemo, type CSSProperties } from "react";
import {
  COUNTDOWN_STARTING_SHORTLY_LABEL,
  getCountdownAriaLabel,
  isCountdownStartingShortly,
  parseCountdownStartMs,
} from "@/lib/experience/countdown-display";
import {
  HOLDING_ROOM_COUNTDOWN_UNITS,
  HOLDING_ROOM_COUNTDOWN_VALUE_CLASS,
  holdingRoomStageRect,
  type HoldingRoomCountdownRect,
  type HoldingRoomCountdownUnitId,
} from "@/lib/experience/holding-room-countdown-slots";
import HoldingRoomCountdownDigit from "@/components/experience/holding-room/HoldingRoomCountdownDigit";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";

type HoldingRoomCountdownOverlayProps = {
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
};

/** Band across all four neon countdown circles on holding-room.png. */
const STARTING_SHORTLY_BAND: HoldingRoomCountdownRect = {
  left: 4,
  top: 42.5,
  width: 88,
  height: 14,
};

function rectStyle(rect: HoldingRoomCountdownRect): CSSProperties {
  const stage = holdingRoomStageRect(rect);
  return {
    position: "absolute",
    left: `${stage.left}%`,
    top: `${stage.top}%`,
    width: `${stage.width}%`,
    height: `${stage.height}%`,
  };
}

function pad(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

function resolveUnitValues(
  unit: HoldingRoomCountdownUnitId,
  countdown: ReturnType<typeof useLobbyCountdown>["countdown"],
): string {
  const hasPartialDayRemainder =
    countdown.hours > 0 || countdown.minutes > 0 || countdown.seconds > 0;
  const displayDays =
    countdown.isComplete || countdown.days === 0
      ? countdown.days
      : countdown.days + (hasPartialDayRemainder ? 1 : 0);

  switch (unit) {
    case "days":
      return pad(displayDays);
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
  initialCountdown,
}: HoldingRoomCountdownOverlayProps) {
  const { config, countdown, eventPhase, isLoading } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
    initialCountdown,
  });

  const hasStartTime = parseCountdownStartMs(config.start_time) !== null;
  const startingShortly = isCountdownStartingShortly(countdown, eventPhase);

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

  const ariaLabel = useMemo(
    () => getCountdownAriaLabel(countdown, eventPhase, { isLoading, hasStartTime }),
    [countdown, eventPhase, hasStartTime, isLoading],
  );

  if (!hasStartTime) {
    return null;
  }

  return (
    <div
      className="holding-room-countdown"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={ariaLabel}
    >
      {startingShortly ? (
        <div
          className="holding-room-countdown__starting-soon"
          style={rectStyle(STARTING_SHORTLY_BAND)}
        >
          <p className="holding-room-countdown__starting-soon-text font-ui">
            {COUNTDOWN_STARTING_SHORTLY_LABEL}
          </p>
        </div>
      ) : (
        HOLDING_ROOM_COUNTDOWN_UNITS.map((unit) => (
          <div key={unit.id} aria-hidden="true">
            <div
              className="holding-room-countdown__label-unit"
              style={rectStyle(unit.labelMask)}
            >
              <div className="holding-room-countdown__label-mask" />
              <div className="holding-room-countdown__label font-ui">{unit.label}</div>
            </div>
            <div className="holding-room-countdown__unit" style={rectStyle(unit.valueMask)}>
              <div className="holding-room-countdown__value-mask" aria-hidden="true" />
              <HoldingRoomCountdownDigit
                value={isLoading ? "00" : values[unit.id]}
                unitClass={HOLDING_ROOM_COUNTDOWN_VALUE_CLASS[unit.id]}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
