"use client";

import Link from "next/link";
import { Radio } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { HUB_SPEC_COLORS } from "@/lib/experience/hub-design-tokens";

type LiveBadgeProps = {
  isLive?: boolean;
  alwaysShow?: boolean;
  liveHref?: string;
  className?: string;
};

export default function LiveBadge({
  isLive = true,
  alwaysShow = false,
  liveHref,
  className = "",
}: LiveBadgeProps) {
  const reduceMotion = useReducedMotion();

  if (!alwaysShow && !isLive) return null;

  const badge = (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 shadow-[0_0_14px_rgba(255,0,127,0.35)] ${className}`}
      style={{
        borderColor: `${HUB_SPEC_COLORS.hotPink}99`,
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }
        }
        transition={reduceMotion ? undefined : { repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
      >
        <Radio className="h-3.5 w-3.5" style={{ color: HUB_SPEC_COLORS.hotPink }} aria-hidden="true" />
      </motion.div>
      <span
        className="font-ui text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: HUB_SPEC_COLORS.hotPink }}
      >
        LIVE NOW
      </span>
    </div>
  );

  if (liveHref && isLive) {
    return (
      <Link href={liveHref} className="inline-block transition hover:scale-[1.03]">
        {badge}
      </Link>
    );
  }

  return badge;
}
