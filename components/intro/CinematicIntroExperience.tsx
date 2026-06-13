"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";

const LOGO_SRC = "/images/logo.png";
const INTRO_BLUE = "#1E40AF";

const fadeUp = (delay: number, reduced: boolean) => ({
  initial: reduced
    ? { opacity: 1, y: 0, filter: "blur(0px)" }
    : { opacity: 0, y: 18, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: {
    duration: reduced ? 0 : 0.9,
    delay: reduced ? 0 : delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

export default function CinematicIntroExperience() {
  const reducedMotion = useReducedMotion() ?? false;
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLogoError = useCallback(() => {
    setLogoFailed(true);
  }, []);

  return (
    <main
      className="cinematic-intro relative isolate flex h-dvh min-h-dvh w-full max-w-[100vw] flex-col overflow-hidden bg-[#0B090A] text-white"
      aria-label="300 Awakening cinematic intro"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="cinematic-intro-nebula cinematic-intro-nebula-blue" />
        <div className="cinematic-intro-nebula cinematic-intro-nebula-magenta" />
        <div className="cinematic-intro-starfield" />
        <div className="cinematic-intro-vignette" />
      </div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
        aria-hidden="true"
        initial={{ opacity: reducedMotion ? 0.55 : 0 }}
        animate={{ opacity: reducedMotion ? 0.55 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.4, delay: reducedMotion ? 0 : 2.5 }}
      >
        <div className="cinematic-intro-energy-field cinematic-intro-energy-blue" />
        <div className="cinematic-intro-energy-field cinematic-intro-energy-magenta" />
        <div className="cinematic-intro-energy-core" />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden="true">
        <div className="cinematic-intro-haze" />
        {PARTICLE_OFFSETS.map((particle, index) => (
          <span
            key={particle.id}
            className={`cinematic-intro-particle cinematic-intro-particle-${index % 3}`}
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          />
        ))}
        <div className="cinematic-intro-lens-flare cinematic-intro-lens-flare-left" />
        <div className="cinematic-intro-lens-flare cinematic-intro-lens-flare-right" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3]" aria-hidden="true">
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="cinematic-intro-crowd h-[clamp(8rem,28vw,16rem)] w-full"
          role="presentation"
        >
          <defs>
            <linearGradient id="crowdFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0B090A" stopOpacity="0" />
              <stop offset="45%" stopColor="#0B090A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0B090A" stopOpacity="0.92" />
            </linearGradient>
          </defs>
          <path
            fill="url(#crowdFade)"
            d="M0,320 L0,180 C120,160 180,120 240,130 C300,140 360,90 420,100 C480,110 540,70 600,85 C660,100 720,55 780,70 C840,85 900,45 960,60 C1020,75 1080,35 1140,50 C1200,65 1260,25 1320,40 C1380,55 1410,70 1440,80 L1440,320 Z"
          />
          <g className="cinematic-intro-crowd-hands" opacity="0.22">
            <path
              fill={INTRO_BLUE}
              d="M120,210 C130,170 150,150 160,190 C170,230 135,235 120,210 Z M300,195 C315,155 340,140 350,185 C360,230 290,225 300,195 Z M520,188 C535,148 560,132 572,178 C584,224 510,218 520,188 Z M740,182 C756,142 782,126 794,172 C806,218 730,212 740,182 Z M960,176 C978,136 1004,120 1016,166 C1028,212 950,206 960,176 Z M1180,170 C1198,130 1224,114 1236,160 C1248,206 1170,200 1180,170 Z"
            />
          </g>
        </svg>
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col items-center justify-between px-[clamp(1rem,4vw,2.5rem)] pb-safe pt-safe">
        <motion.p
          className="mt-[clamp(1.5rem,5vh,3rem)] font-headline text-[clamp(0.72rem,2.2vw,0.95rem)] uppercase tracking-[0.55em] text-zinc-300"
          {...fadeUp(3, reducedMotion)}
        >
          IAN CRAIG AND
        </motion.p>

        <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,1.25rem)]">
          <motion.div
            className="relative flex items-center justify-center"
            initial={
              reducedMotion
                ? { opacity: 1, scale: 1, filter: "blur(0px)" }
                : { opacity: 0, scale: 0.92, filter: "blur(14px)" }
            }
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
              opacity: { duration: reducedMotion ? 0 : 0.95, delay: reducedMotion ? 0 : 1.5 },
              scale: { duration: reducedMotion ? 0 : 0.85, delay: reducedMotion ? 0 : 2 },
              filter: { duration: reducedMotion ? 0 : 0.95, delay: reducedMotion ? 0 : 1.5 },
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="cinematic-intro-logo-glow" aria-hidden="true" />
            <motion.div
              className="cinematic-intro-logo-float relative z-[1]"
              animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
              transition={
                reducedMotion
                  ? undefined
                  : { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }
            >
              {!logoFailed ? (
                <Image
                  src={LOGO_SRC}
                  alt="300 Awakening logo"
                  width={420}
                  height={420}
                  priority
                  onError={handleLogoError}
                  className="h-[clamp(9rem,34vw,17rem)] w-[clamp(9rem,34vw,17rem)] object-contain drop-shadow-[0_0_45px_rgba(30,64,175,0.35)]"
                  sizes="(max-width: 768px) 60vw, 420px"
                />
              ) : (
                <div
                  className="flex h-[clamp(9rem,34vw,17rem)] w-[clamp(9rem,34vw,17rem)] items-center justify-center rounded-full border border-[#1E40AF]/40 bg-[#0B090A]/80 shadow-[0_0_60px_rgba(30,64,175,0.35),0_0_80px_rgba(176,38,122,0.2)]"
                  aria-label="300 Awakening"
                >
                  <span className="font-headline text-[clamp(4rem,18vw,7rem)] leading-none tracking-[0.08em] text-white">
                    300
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>

          <motion.h1
            className="cinematic-intro-awakening font-headline text-[clamp(2.4rem,9vw,5.5rem)] uppercase leading-[0.92] tracking-[0.22em] text-white"
            {...fadeUp(3.5, reducedMotion)}
          >
            AWAKENING
          </motion.h1>
        </div>

        <motion.div
          className="mb-[clamp(1.25rem,4vh,2.5rem)] w-full max-w-md"
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.85, delay: reducedMotion ? 0 : 4 }}
        >
          <Link
            href="/dashboard"
            className="cinematic-intro-enter group relative flex min-h-[3.25rem] w-full touch-target transform-gpu items-center justify-center rounded-full px-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E40AF]"
          >
            <span className="relative z-[1] font-ui text-[clamp(0.68rem,2.4vw,0.82rem)] font-bold uppercase tracking-[0.24em] text-white">
              Enter Experience
            </span>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

const PARTICLE_OFFSETS = [
  { id: "p1", left: "8%", top: "18%", delay: 1, duration: 11 },
  { id: "p2", left: "18%", top: "62%", delay: 1.2, duration: 13 },
  { id: "p3", left: "28%", top: "34%", delay: 1.4, duration: 10 },
  { id: "p4", left: "42%", top: "22%", delay: 1.1, duration: 12 },
  { id: "p5", left: "55%", top: "48%", delay: 1.3, duration: 14 },
  { id: "p6", left: "68%", top: "28%", delay: 1.5, duration: 11 },
  { id: "p7", left: "78%", top: "58%", delay: 1.25, duration: 12 },
  { id: "p8", left: "88%", top: "36%", delay: 1.35, duration: 10 },
  { id: "p9", left: "12%", top: "78%", delay: 1.45, duration: 13 },
  { id: "p10", left: "50%", top: "72%", delay: 1.15, duration: 11 },
  { id: "p11", left: "72%", top: "82%", delay: 1.55, duration: 12 },
  { id: "p12", left: "34%", top: "12%", delay: 1.05, duration: 14 },
] as const;
