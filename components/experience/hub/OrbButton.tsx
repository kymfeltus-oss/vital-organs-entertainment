"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { HUB_SPEC_COLORS, HUB_SPEC_GLOWS, MOTION_VARIANTS } from "@/lib/experience/hub-design-tokens";

type OrbButtonProps = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageFallback?: string;
  href: string;
  fallbackIcon: LucideIcon;
  delayIndex: number;
};

export default function OrbButton({
  title,
  subtitle,
  imageSrc,
  imageFallback,
  href,
  fallbackIcon: FallbackIcon,
  delayIndex,
}: OrbButtonProps) {
  const reduceMotion = useReducedMotion();
  const [currentSrc, setCurrentSrc] = useState(imageSrc);
  const [useIcon, setUseIcon] = useState(false);

  const floatMotion = reduceMotion ? {} : MOTION_VARIANTS.orbFloat(delayIndex * 0.2);

  return (
    <Link href={href} className="group block">
      <motion.div
        {...floatMotion}
        className="flex cursor-pointer flex-col items-center space-y-3 text-center"
      >
        <div
          className="relative flex h-[clamp(140px,12vw,210px)] w-[clamp(140px,12vw,210px)] items-center justify-center rounded-full border border-[#FF007F]/50 bg-gradient-to-b from-white/[0.08] to-transparent transition-all duration-300 group-hover:scale-[1.04] group-hover:border-[#00E6FF]/70"
          style={{ boxShadow: HUB_SPEC_GLOWS.orbOuter }}
        >
          <div className="relative flex h-[clamp(110px,10vw,170px)] w-[clamp(110px,10vw,170px)] items-center justify-center overflow-hidden rounded-full bg-black/30 ring-2 ring-[#00E6FF]/30">
            {!useIcon ? (
              <Image
                src={currentSrc}
                alt={title}
                fill
                className="object-contain p-2 transition-opacity duration-300"
                onError={() => {
                  if (imageFallback && currentSrc !== imageFallback) {
                    setCurrentSrc(imageFallback);
                    return;
                  }
                  setUseIcon(true);
                }}
              />
            ) : (
              <FallbackIcon className="h-8 w-8 text-[#00E6FF]" />
            )}
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.14),transparent_62%)]" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h3
            className="font-headline text-[clamp(0.8rem,1.2vw,0.95rem)] uppercase tracking-[0.14em] text-white transition-colors group-hover:text-[#00E6FF]"
            style={{ textShadow: "0 0 18px rgba(0,230,255,0.35)" }}
          >
            {title}
          </h3>
          <p className="line-clamp-2 max-w-[180px] font-ui text-[11px] tracking-wide text-white/70">
            {subtitle}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
