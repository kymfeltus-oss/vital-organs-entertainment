"use client";

import { useEffect, useRef, type ReactNode } from "react";

type TodaysServiceMainProps = {
  children: ReactNode;
  className?: string;
};

/** Single dashboard landmark — supports skip-link focus via #main-content. */
export default function TodaysServiceMain({ children, className = "" }: TodaysServiceMainProps) {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const focusMainFromSkipLink = () => {
      if (window.location.hash !== "#main-content") return;
      mainRef.current?.focus({ preventScroll: false });
    };

    focusMainFromSkipLink();
    window.addEventListener("hashchange", focusMainFromSkipLink);
    return () => window.removeEventListener("hashchange", focusMainFromSkipLink);
  }, []);

  return (
    <main id="main-content" tabIndex={-1} ref={mainRef} className={className}>
      {children}
    </main>
  );
}
