"use client";

import { useEffect, useState } from "react";
import { computeCountdown, type CountdownParts } from "@/lib/live/event-lobby";

export function useEventCountdown(targetIso: string): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>(() => computeCountdown(targetIso));

  useEffect(() => {
    const tick = () => setParts(computeCountdown(targetIso));
    tick();
    const intervalId = window.setInterval(tick, 1_000);
    return () => window.clearInterval(intervalId);
  }, [targetIso]);

  return parts;
}
