"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play, Volume2 } from "lucide-react";
import { ACTUAL_ASSET_MAP, HUB_SPEC_COLORS, HUB_SPEC_GLOWS } from "@/lib/experience/hub-design-tokens";

type MissionStoryCardProps = {
  desktop?: boolean;
  ctaHref?: string;
  className?: string;
  style?: CSSProperties;
};

export default function MissionStoryCard({
  ctaHref = "/experience/music",
  className = "",
  style,
}: MissionStoryCardProps) {
  const reduceMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={`relative z-[50] max-w-full min-h-[360px] overflow-hidden rounded-[28px] border bg-[rgba(5,8,18,0.94)] p-5 md:p-7 ${className}`}
      style={{
        width: "min(100%, clamp(760px, 56vw, 980px))",
        borderColor: "rgba(255, 0, 127, 0.75)",
        boxShadow: HUB_SPEC_GLOWS.missionCard,
        ...style,
      }}
    >
      <div className="grid h-full grid-cols-1 items-center gap-6 md:grid-cols-[1fr_42%]">
        <div className="order-2 flex flex-col items-start space-y-3 md:order-1">
          <span
            className="font-ui text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: HUB_SPEC_COLORS.hotPink }}
          >
            MISSION STORY
          </span>
          <h2 className="font-headline text-[clamp(1.75rem,3vw,2.35rem)] uppercase leading-none tracking-wide text-white">
            Ian Craig&apos;s 30+ Year Dialysis Journey
          </h2>
          <p className="font-ui text-sm leading-relaxed text-white/80">
            A story of faith, endurance and purpose. Help us build the new treatment center and change lives for
            generations to come.
          </p>
          <Link
            href={ctaHref}
            className="group mt-2 flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-2.5 font-ui text-xs uppercase tracking-wider text-white transition-all hover:border-[#FF007F]/50 hover:bg-white/10"
          >
            WATCH FULL STORY
            <Play
              className="h-3 w-3 fill-current transition-transform group-hover:scale-110"
              style={{ color: HUB_SPEC_COLORS.hotPink }}
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="group relative order-1 aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#020207] shadow-2xl md:order-2">
          {!imgFailed ? (
            <Image
              src={ACTUAL_ASSET_MAP.missionImage}
              alt="Ian Craig mission story"
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-contain object-center transition-transform duration-700 group-hover:scale-[1.02]"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,0,127,0.18) 0%, rgba(123,45,255,0.22) 45%, rgba(0,230,255,0.16) 100%)",
              }}
              aria-hidden="true"
            />
          )}

          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 font-mono text-[10px] tracking-tighter text-white/70">
            <Volume2 className="h-3 w-3" style={{ color: HUB_SPEC_COLORS.cyan }} aria-hidden="true" />
            12:45
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <Link href={ctaHref} aria-label="Watch full story">
              <motion.span
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        boxShadow: [
                          "0 0 0px rgba(123,45,255,0)",
                          "0 0 25px rgba(123,45,255,0.6)",
                          "0 0 0px rgba(123,45,255,0)",
                        ],
                      }
                }
                transition={reduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#7B2DFF] to-[#FF007F] text-white shadow-xl transition-transform duration-300 hover:scale-110"
              >
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </motion.span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
