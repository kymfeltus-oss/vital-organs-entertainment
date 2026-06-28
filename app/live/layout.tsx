import type { ReactNode } from "react";

/**
 * Live route shell — no document-level asset preloads; playback URLs load via manifest API only.
 * Uses root globals.css (tokens + Tailwind) only — no attendee artboard stylesheet on this route.
 */
export default function LiveLayout({ children }: { children: ReactNode }) {
  return children;
}
