"use client";

import { useEffect, useState } from "react";
import { getCountdownParts, type CountdownParts } from "@/lib/countdown";

const PLACEHOLDER: CountdownParts = {
  days: "00",
  hours: "00",
  minutes: "00",
  seconds: "00",
};

export function useCountdown(target: Date): CountdownParts {
  const [countdown, setCountdown] = useState<CountdownParts>(PLACEHOLDER);

  useEffect(() => {
    const tick = () => setCountdown(getCountdownParts(target));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return countdown;
}
