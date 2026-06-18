"use client";

import { useEffect, useState } from "react";
import {
  computeEventCountdownPhase,
  type EventCountdownPhase,
} from "@/lib/live/countdown-config";

export function useEventPhase(startTime: string, endTime: string): EventCountdownPhase {
  const [phase, setPhase] = useState<EventCountdownPhase>(() =>
    computeEventCountdownPhase(startTime, endTime),
  );

  useEffect(() => {
    const tick = () => setPhase(computeEventCountdownPhase(startTime, endTime));
    tick();
    const intervalId = window.setInterval(tick, 1_000);
    return () => window.clearInterval(intervalId);
  }, [endTime, startTime]);

  return phase;
}
