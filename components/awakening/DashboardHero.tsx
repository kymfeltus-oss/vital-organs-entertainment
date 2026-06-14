"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AWAKENING_COLORS } from "@/components/awakening/constants";

type DashboardHeroProps = {
  liveHref?: string;
};

export default function DashboardHero({ liveHref }: DashboardHeroProps) {
  const reduceMotion = useReducedMotion();

  const liveBadge = (
    <motion.span
      className="inline-flex min-h-9 items-center justify-center rounded-full px-5 py-1.5 font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em]"
      style={{
        color: AWAKENING_COLORS.pink,
        border: `1px solid ${AWAKENING_COLORS.pink}aa`,
        backgroundColor: `${AWAKENING_COLORS.pink}18`,
        boxShadow: `0 0 22px ${AWAKENING_COLORS.pink}55`,
      }}
      animate={reduceMotion ? undefined : { boxShadow: [`0 0 18px ${AWAKENING_COLORS.pink}44`, `0 0 28px ${AWAKENING_COLORS.pink}88`, `0 0 18px ${AWAKENING_COLORS.pink}44`] }}
      transition={reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      ((•)) LIVE NOW
    </motion.span>
  );

  return (
    <section className="mt-2 text-center md:mt-3">
      {liveHref ? (
        <Link href={liveHref} className="inline-block transition hover:scale-[1.03]">
          {liveBadge}
        </Link>
      ) : (
        liveBadge
      )}

      <h1 className="font-headline mt-4 text-[clamp(2.1rem,4.8vw,4.25rem)] uppercase leading-[0.92] tracking-[0.1em] text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.16)]">
        THE SANCTUARY STAGE IS OPEN
      </h1>
      <p className="mt-3 font-ui text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/55 md:text-[0.82rem]">
        JOIN THOUSANDS IN WORSHIP, UNITY AND IMPACT.
      </p>
    </section>
  );
}
