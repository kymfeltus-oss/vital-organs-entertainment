"use client";

import { useEffect, useRef } from "react";
import { AWAKENING_ASSETS } from "@/components/awakening/constants";
import { EXPERIENCE_BG_ART } from "@/components/awakening/experience-critical-bg.css";

const DEBUG_ENDPOINT = "http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00";

function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
    body: JSON.stringify({
      sessionId: "baf5b9",
      runId: "align-v1",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function timeSinceNavigationMs(): number {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!nav) return Math.round(performance.now());
  return Math.round(performance.now() - nav.startTime);
}

type LayerProps = {
  id: string;
  src: string;
  fetchPriority?: "high" | "low" | "auto";
  onReady: (id: string, ok: boolean, width: number, height: number, elapsedMs: number) => void;
};

function BackgroundLayer({ id, src, fetchPriority = "auto", onReady }: LayerProps) {
  const mountMsRef = useRef(timeSinceNavigationMs());

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-layer={id}
      src={src}
      alt=""
      decoding="async"
      loading="eager"
      fetchPriority={fetchPriority}
      onLoad={(event) => {
        onReady(
          id,
          true,
          event.currentTarget.naturalWidth,
          event.currentTarget.naturalHeight,
          timeSinceNavigationMs() - mountMsRef.current,
        );
      }}
      onError={() => {
        onReady(id, false, 0, 0, timeSinceNavigationMs() - mountMsRef.current);
      }}
    />
  );
}

export default function DashboardBackground() {
  const shellRef = useRef<HTMLDivElement>(null);
  const mountNavMsRef = useRef(0);
  const layerUrls = AWAKENING_ASSETS.background;

  useEffect(() => {
    mountNavMsRef.current = timeSinceNavigationMs();

    const fallback = document.querySelector("[data-experience-bg-fallback]");
    fallback?.remove();

    debugLog("D", "DashboardBackground.tsx:paths", "Resolved background URLs", {
      layerUrls,
      mountNavMs: mountNavMsRef.current,
      allWebAccessible: Object.values(layerUrls).every(
        (src) => src.startsWith("/backgrounds/") && !src.includes(":\\"),
      ),
    });

    debugLog("B", "DashboardBackground.tsx:mount", "Inline img stack mounted (no portal gate)", {
      layers: layerUrls,
      portal: false,
      criticalCss: true,
    });

    const sampleCompositedPixels = () => {
      const shell = shellRef.current;
      if (!shell) return { ready: false as const };

      const scene = shell.querySelector("[data-experience-bg-scene]");
      const imgs = scene ? Array.from(scene.querySelectorAll("img")) : [];
      if (imgs.length !== 4 || imgs.some((img) => !img.complete || img.naturalWidth === 0)) {
        return { ready: false as const };
      }

      const sceneRect = scene!.getBoundingClientRect();
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      const canvas = document.createElement("canvas");
      canvas.width = viewW;
      canvas.height = viewH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return { ready: false as const };

      ctx.fillStyle = "#020208";
      ctx.fillRect(0, 0, viewW, viewH);

      for (const img of imgs) {
        const style = window.getComputedStyle(img);
        ctx.globalAlpha = Number.parseFloat(style.opacity) || 1;
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(img, sceneRect.left, sceneRect.top, sceneRect.width, sceneRect.height);
      }

      const points = [
        { id: "center", x: Math.floor(viewW / 2), y: Math.floor(viewH / 2) },
        { id: "upperStage", x: Math.floor(viewW / 2), y: Math.floor(viewH * 0.22) },
        { id: "crowdBand", x: Math.floor(viewW / 2), y: Math.floor(viewH * 0.88) },
      ];

      return {
        ready: true as const,
        samples: points.map((point) => {
          const [r, g, b, a] = ctx.getImageData(point.x, point.y, 1, 1).data;
          return {
            ...point,
            r,
            g,
            b,
            a,
            checkerboardLike: r > 200 && g > 200 && b > 200 && a === 255,
          };
        }),
      };
    };

    const measure = (label: string) => {
      const shell = shellRef.current;
      if (!shell) return;

      const rect = shell.getBoundingClientRect();
      const scene = shell.querySelector("[data-experience-bg-scene]");
      const sceneRect = scene?.getBoundingClientRect();
      const imgs = shell.querySelectorAll("img");
      const main = document.querySelector("main");
      const mainStyle = main ? window.getComputedStyle(main) : null;
      const composited = sampleCompositedPixels();

      debugLog("L", "DashboardBackground.tsx:measure", "Background shell metrics", {
        label,
        timeSinceNavMs: timeSinceNavigationMs(),
        viewport: { width: window.innerWidth, height: window.innerHeight },
        artboard: EXPERIENCE_BG_ART,
        sceneRect: sceneRect
          ? {
              width: sceneRect.width,
              height: sceneRect.height,
              left: sceneRect.left,
              bottom: window.innerHeight - sceneRect.bottom,
            }
          : null,
        rect: { width: rect.width, height: rect.height },
        imgCount: imgs.length,
        layerBlends: Array.from(imgs).map((img, index) => {
          const style = window.getComputedStyle(img);
          return {
            index,
            src: img.getAttribute("src"),
            zIndex: style.zIndex,
            mixBlendMode: style.mixBlendMode,
            opacity: style.opacity,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
          };
        }),
        mainBackgroundColor: mainStyle?.backgroundColor ?? null,
        networkResources: performance
          .getEntriesByType("resource")
          .filter((entry) => entry.name.includes("/backgrounds/"))
          .map((entry) => {
            const timing = entry as PerformanceResourceTiming;
            return {
              url: timing.name.replace(window.location.origin, ""),
              durationMs: Math.round(timing.duration),
              transferSize: timing.transferSize,
              responseStatus: timing.responseStatus ?? null,
            };
          }),
        compositedPixels: composited,
      });
    };

    measure("hydration");
    const t1 = window.setTimeout(() => measure("t+500ms"), 500);
    const t2 = window.setTimeout(() => measure("t+2000ms"), 2000);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [layerUrls.base, layerUrls.crowd, layerUrls.lightBeams, layerUrls.performers]);

  const handleLayerReady = (
    layerId: string,
    ok: boolean,
    width: number,
    height: number,
    elapsedMs: number,
  ) => {
    debugLog(
      ok ? "A" : "D",
      "DashboardBackground.tsx:onReady",
      ok ? "Background img layer painted" : "Background img layer failed",
      {
        layerId,
        ok,
        width,
        height,
        elapsedMs,
        timeSinceNavMs: timeSinceNavigationMs(),
      },
    );
  };

  return (
    <>
      <div ref={shellRef} data-experience-bg-shell aria-hidden="true">
        <div data-experience-bg-scene>
          <BackgroundLayer
            id="base"
            src={layerUrls.base}
            fetchPriority="high"
            onReady={handleLayerReady}
          />
          <BackgroundLayer
            id="lightBeams"
            src={layerUrls.lightBeams}
            onReady={handleLayerReady}
          />
          <BackgroundLayer
            id="performers"
            src={layerUrls.performers}
            onReady={handleLayerReady}
          />
          <BackgroundLayer
            id="crowd"
            src={layerUrls.crowd}
            onReady={handleLayerReady}
          />
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 28%, rgba(2,2,8,0.5) 65%, rgba(2,2,8,0.82) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="awakening-grain pointer-events-none fixed inset-0 z-[2] opacity-[0.05]" aria-hidden="true" />
    </>
  );
}
