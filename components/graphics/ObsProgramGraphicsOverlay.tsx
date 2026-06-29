"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { ProgramGraphic } from "@/lib/graphics/program-state";
import "@/styles/features/program-graphics-overlay.css";

const EXIT_MS = 260;
const SWITCH_MS = 180;
const POLL_MS = 1_500;
const EVENT_ID = "300-awakening";

type ProgramResponse = {
  graphic?: ProgramGraphic | null;
};

function anchorClass(anchor: ProgramGraphic["theme"]["placementAnchor"]) {
  return `program-graphics-overlay--anchor-${anchor.toLowerCase().replace("_", "-")}`;
}

function typeClass(type: ProgramGraphic["type"]) {
  return `program-graphics-overlay--type-${type.toLowerCase().replace("_", "-")}`;
}

export default function ObsProgramGraphicsOverlay({
  initialGraphic,
}: {
  initialGraphic: ProgramGraphic | null;
}) {
  const [graphic, setGraphic] = useState<ProgramGraphic | null>(initialGraphic);
  const [visible, setVisible] = useState(Boolean(initialGraphic));
  const graphicRef = useRef(initialGraphic);
  const transitionTimerRef = useRef<number | null>(null);

  const transitionTo = useCallback((next: ProgramGraphic | null) => {
    const current = graphicRef.current;
    const currentSignature = current ? `${current.id}:${current.updatedAt}` : "none";
    const nextSignature = next ? `${next.id}:${next.updatedAt}` : "none";
    if (currentSignature === nextSignature) return;

    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    if (!next) {
      setVisible(false);
      transitionTimerRef.current = window.setTimeout(() => {
        graphicRef.current = null;
        setGraphic(null);
      }, EXIT_MS);
      return;
    }

    if (current) {
      setVisible(false);
      transitionTimerRef.current = window.setTimeout(() => {
        graphicRef.current = next;
        setGraphic(next);
        window.requestAnimationFrame(() => setVisible(true));
      }, SWITCH_MS);
      return;
    }

    graphicRef.current = next;
    setGraphic(next);
    window.requestAnimationFrame(() => setVisible(true));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/graphics/program", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as ProgramResponse;
      transitionTo(data.graphic ?? null);
    } catch {
      // Preserve the last known graphic; the next realtime event or poll retries.
    }
  }, [transitionTo]);

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("public-program-graphics-overlay")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "owner_graphics_presets",
          filter: `event_id=eq.${EVENT_ID}`,
        },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "owner_graphics_global_theme",
          filter: `event_id=eq.${EVENT_ID}`,
        },
        () => void refresh(),
      )
      .subscribe();

    const pollId = window.setInterval(() => void refresh(), POLL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibility);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  if (!graphic) return null;

  const style = {
    "--program-graphics-radius": `${graphic.theme.cornerRadiusPx}px`,
    "--program-graphics-padding": `${graphic.theme.paddingPx}px`,
    "--program-graphics-opacity": graphic.theme.backgroundOpacityPercent / 100,
  } as CSSProperties;

  return (
    <div
      className={`program-graphics-overlay ${typeClass(graphic.type)} ${anchorClass(
        graphic.theme.placementAnchor,
      )} ${visible ? "program-graphics-overlay--visible" : "program-graphics-overlay--exiting"}`}
      style={style}
      aria-live="polite"
    >
      <div className="program-graphics-overlay__accent" aria-hidden="true" />
      <div className="program-graphics-overlay__copy">
        {graphic.theme.customLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="program-graphics-overlay__logo"
            src={graphic.theme.customLogoUrl}
            alt=""
            aria-hidden="true"
          />
        ) : (
          <div className="program-graphics-overlay__mark" aria-hidden="true">
            300
            <span>Awakening</span>
          </div>
        )}
        <div>
          <strong>{graphic.contentPrimary}</strong>
          {graphic.contentSecondary ? <span>{graphic.contentSecondary}</span> : null}
        </div>
      </div>
    </div>
  );
}
