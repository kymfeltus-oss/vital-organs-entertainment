"use client";

import { motion } from "framer-motion";

const NODES: Array<{ x: number; y: number; delay: number }> = [
  { x: 12, y: 38, delay: 0 },
  { x: 22, y: 52, delay: 0.4 },
  { x: 34, y: 28, delay: 0.8 },
  { x: 48, y: 44, delay: 0.2 },
  { x: 56, y: 62, delay: 1.1 },
  { x: 68, y: 32, delay: 0.6 },
  { x: 78, y: 48, delay: 1.4 },
  { x: 88, y: 58, delay: 0.9 },
  { x: 42, y: 68, delay: 1.6 },
  { x: 72, y: 22, delay: 0.3 },
  { x: 18, y: 72, delay: 1.8 },
  { x: 92, y: 34, delay: 1.2 },
];

const CONNECTIONS = [
  [0, 1],
  [1, 3],
  [2, 3],
  [3, 4],
  [3, 5],
  [5, 6],
  [6, 7],
  [4, 8],
  [5, 9],
  [0, 10],
  [7, 11],
  [6, 9],
];

type AudienceMapProps = {
  liveViewerCount: number;
  isLive: boolean;
  activeSponsorPlacements: number;
};

function resolveActiveNodeCount(liveViewerCount: number, isLive: boolean): number {
  if (!isLive || liveViewerCount <= 0) return 0;
  return Math.min(NODES.length, Math.max(1, Math.ceil(liveViewerCount / 25)));
}

export default function AudienceMap({
  liveViewerCount,
  isLive,
  activeSponsorPlacements,
}: AudienceMapProps) {
  const activeNodes = resolveActiveNodeCount(liveViewerCount, isLive);
  const liveNodeIndex = isLive && activeNodes > 0 ? 3 : -1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#141414]"
      aria-label="Global fan activity visualization"
    >
      <div
        className="relative aspect-[21/9] min-h-[220px] w-full sm:min-h-[280px] lg:min-h-[320px]"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, #0d0d0d 0%, #111111 72%), linear-gradient(180deg, #141414 0%, #111111 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `
              linear-gradient(#2A2A2A 1px, transparent 1px),
              linear-gradient(90deg, #2A2A2A 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[#CCFF00]/20 to-transparent" />
        <div className="liv-map-scanline pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-[#CCFF00]/0 via-[#CCFF00]/[0.03] to-transparent" />

        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {CONNECTIONS.map(([a, b], i) => {
            const from = NODES[a];
            const to = NODES[b];
            const isActive = a < activeNodes && b < activeNodes;

            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isActive ? "#CCFF00" : "#ffffff"}
                strokeOpacity={isActive ? 0.2 : 0.08}
                strokeWidth={0.15}
              />
            );
          })}
        </svg>

        {NODES.map((node, i) => {
          const isActive = i < activeNodes;
          const isPrimary = i === liveNodeIndex;

          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {isPrimary ? (
                <span className="liv-live-dot relative flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#CCFF00]">
                  <span className="absolute h-4 w-4 rounded-full bg-[#CCFF00]/20" />
                </span>
              ) : (
                <span
                  className={`block h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-[#CCFF00]" : "bg-white/30"
                  }`}
                  style={{ animationDelay: `${node.delay}s` }}
                />
              )}
              <span
                className="absolute left-1/2 top-full mt-1 h-3 w-px -translate-x-1/2 bg-gradient-to-b from-[#CCFF00]/30 to-transparent"
                aria-hidden
              />
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 px-4 pb-4 pt-10 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-5">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
              Global Fan Activity
            </p>
            <p className="mt-1 text-sm text-white/80">
              {isLive
                ? `${liveViewerCount.toLocaleString()} concurrent viewers tracked`
                : "Awaiting live broadcast signal"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">
              Sponsor Deck
            </p>
            <p className="mt-1 text-sm text-[#CCFF00]">
              {activeSponsorPlacements} active placement
              {activeSponsorPlacements === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
