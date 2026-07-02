"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getCountdownAriaLabel,
  parseCountdownStartMs,
} from "@/lib/experience/countdown-display";
import type { AttendeeUiPhase } from "@/lib/live/attendee-ui-phase";
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
  attendeeUiPhase?: AttendeeUiPhase;
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
  initialCountdown,
  attendeeUiPhase,
}: HoldingRoomCountdownOverlayProps) {
  const { config, countdown, eventPhase, isLoading } = useLobbyCountdown({
    initialConfig: initialCountdownConfig,
    initialCountdown,
  });

  const hasStartTime =
    parseCountdownStartMs(config.start_time) !== null ||
    parseCountdownStartMs(initialCountdownConfig?.start_time) !== null;
  const phase = attendeeUiPhase ?? eventPhase;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCountdown = !mounted && initialCountdown ? initialCountdown : countdown;

  const values = useMemo(
    () =>
      Object.fromEntries(
        HOLDING_ROOM_COUNTDOWN_UNITS.map((unit) => [
          unit.id,
          resolveUnitValues(unit.id, isLoading && initialCountdown ? initialCountdown : displayCountdown),
        ]),
      ) as Record<HoldingRoomCountdownUnitId, string>,
    [displayCountdown, initialCountdown, isLoading],
  );

  const ariaLabel = useMemo(() => {
    const snapshot = !mounted && initialCountdown ? initialCountdown : countdown;
    return getCountdownAriaLabel(snapshot, phase, { isLoading, hasStartTime });
  }, [countdown, hasStartTime, initialCountdown, isLoading, mounted, phase]);

  if (!hasStartTime) {
    return null;
  }

  return (
    <div
      className="holding-room-countdown"
      aria-live="polite"
      aria-label={ariaLabel}
      suppressHydrationWarning
    >
      {HOLDING_ROOM_COUNTDOWN_UNITS.map((unit) => (
        <div key={unit.id} aria-hidden="true">
          <div
            className="holding-room-countdown__label-unit"
            style={rectStyle(unit.labelMask)}
          >
            <div className="holding-room-countdown__label font-ui">{unit.label}</div>
          </div>
          <div className="holding-room-countdown__unit" style={rectStyle(unit.valueMask)}>
            <HoldingRoomCountdownDigit
              value={values[unit.id]}
              unitClass={HOLDING_ROOM_COUNTDOWN_VALUE_CLASS[unit.id]}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
