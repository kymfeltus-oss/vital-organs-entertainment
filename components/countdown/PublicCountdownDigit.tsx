"use client";

import { useEffect, useRef, useState } from "react";

type PublicCountdownDigitProps = {
  value: string;
  digitClass: string;
  pulse?: boolean;
};

export default function PublicCountdownDigit({
  value,
  digitClass,
  pulse = false,
}: PublicCountdownDigitProps) {
  const [isTicking, setIsTicking] = useState(false);
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (previousValueRef.current === value) return;
    previousValueRef.current = value;
    setIsTicking(true);
    const timeoutId = window.setTimeout(() => setIsTicking(false), 520);
    return () => window.clearTimeout(timeoutId);
  }, [value]);

  return (
    <span
      className={[
        "public-countdown-unit__digit font-headline",
        digitClass,
        isTicking ? "public-countdown-unit__digit--tick" : "",
        pulse ? "public-countdown-unit__digit--pulse" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      suppressHydrationWarning
    >
      {value}
    </span>
  );
}
