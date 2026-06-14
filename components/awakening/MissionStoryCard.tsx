"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import StoryCardImage from "@/components/awakening/StoryCardImage";
import WaveformGraphic from "@/components/awakening/WaveformGraphic";
import { AWAKENING_COLORS } from "@/components/awakening/constants";

export default function MissionStoryCard() {
  const reduceMotion = useReducedMotion();

  return (
    <article
      className="mx-auto mt-8 w-full max-w-[920px] overflow-hidden rounded-2xl border border-[#FF007F] backdrop-blur-xl"
      style={{
        boxShadow: "0 0 20px rgba(255,0,127,0.6), 0 0 48px rgba(255,0,127,0.22)",
        background: "linear-gradient(rgba(9,11,19,0.88), rgba(9,11,19,0.88))",
      }}
    >
      <div className="grid min-h-[320px] grid-cols-1 lg:grid-cols-[42%_58%]">
        <div className="flex flex-col justify-between p-6 md:p-8">
          <div>
            <p
              className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.24em]"
              style={{ color: AWAKENING_COLORS.pink }}
            >
              MISSION STORY
            </p>
            <h2 className="font-headline mt-3 text-[clamp(1.3rem,2.2vw,1.95rem)] uppercase leading-tight tracking-[0.08em] text-white">
              Ian Craig&apos;s 30+ Year Dialysis Journey
            </h2>
            <p className="mt-3 font-ui text-[0.92rem] leading-relaxed text-white/68">
              A story of faith, endurance and purpose. Help us build the new treatment center and change lives for
              generations to come.
            </p>
          </div>

          <Link
            href="/experience/music"
            className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-white/25 bg-transparent px-5 font-ui text-[0.64rem] font-bold uppercase tracking-[0.14em] text-white transition hover:border-[#FF007F]/70 hover:text-[#FF007F]"
          >
            WATCH FULL STORY
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative min-h-[240px] lg:min-h-full">
          <StoryCardImage alt="Ian Craig mission story" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020208]/65 via-transparent to-transparent" />

          <div
            className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-[#FF007F]/50 px-3 py-1 backdrop-blur-md"
            style={{ backgroundColor: "rgba(2,2,8,0.72)", boxShadow: "0 0 16px rgba(255,0,127,0.45)" }}
          >
            <WaveformGraphic variant="pink" active />
            <span className="font-ui text-[0.62rem] font-bold tracking-[0.08em]">12:45</span>
          </div>

          <Link
            href="/experience/music"
            aria-label="Watch full story"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <motion.span
              className="flex h-18 w-18 items-center justify-center rounded-full border border-white/35 bg-white/15 text-white backdrop-blur-sm"
              style={{ boxShadow: "0 0 30px rgba(255,255,255,0.25)" }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      boxShadow: [
                        "0 0 24px rgba(255,255,255,0.2)",
                        "0 0 40px rgba(255,255,255,0.45)",
                        "0 0 24px rgba(255,255,255,0.2)",
                      ],
                      scale: [1, 1.04, 1],
                    }
              }
              transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Play className="h-8 w-8 fill-current" />
            </motion.span>
          </Link>
        </div>
      </div>
    </article>
  );
}
