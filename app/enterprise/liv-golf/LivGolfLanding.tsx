"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import LivGolfLogo from "./LivGolfLogo";
import ParableEnterpriseLogo from "./ParableEnterpriseLogo";

export default function LivGolfLanding() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-black text-white"
    >
      {/* Atmospheric background — no photo */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 42% at 6% 92%, rgba(210,120,40,0.18) 0%, transparent 58%), radial-gradient(ellipse 90% 60% at 50% 110%, rgba(0,0,0,0.85) 0%, transparent 55%), linear-gradient(180deg, #050505 0%, #000000 42%, #020202 100%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-start justify-between px-6 pt-8 sm:px-10 sm:pt-10 lg:px-14 lg:pt-12">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ParableEnterpriseLogo />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="flex w-[148px] flex-col items-end text-right sm:w-[168px]"
        >
          <p className="text-[11px] font-light tracking-wide text-white/55">
            Prepared Exclusively For
          </p>
          <p className="mt-0.5 text-sm font-medium text-white sm:text-[15px]">
            LIV Golf Leadership
          </p>
          <div className="mt-4 h-px w-full bg-white/25" />
          <div className="mt-4 flex w-full justify-end">
            <LivGolfLogo />
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="liv-live-dot h-2 w-2 rounded-full bg-[#CCFF00]" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#CCFF00]">
              Live
            </span>
          </div>
        </motion.div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-10 text-center sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl"
        >
          <h1 className="space-y-1 sm:space-y-2">
            <span className="block text-[2.35rem] font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-[3.25rem] lg:text-[4.5rem]">
              OWN THE MOMENT.
            </span>
            <span className="block text-[2.35rem] font-bold uppercase leading-[0.95] tracking-tight text-white/42 sm:text-[3.25rem] lg:text-[4.5rem]">
              OWN THE FAN.
            </span>
            <span className="block text-[2.35rem] font-bold uppercase leading-[0.95] tracking-tight text-white/26 sm:text-[3.25rem] lg:text-[4.5rem]">
              OWN THE FUTURE.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-sm font-light leading-relaxed text-white/85 sm:mt-10 sm:text-base lg:text-[17px]">
            One platform for streaming, fan engagement, commerce, sponsorship, and audience
            ownership.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 sm:mt-12"
          >
            <Link
              href="/enterprise/liv-golf/command-center"
              className="liv-cta-button group inline-flex items-center gap-4 rounded-full px-10 py-4 transition-all duration-300 sm:px-12 sm:py-[1.125rem]"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-white sm:text-xs">
                ENTER THE EXPERIENCE
              </span>
              <span
                className="text-lg text-white/90 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between px-6 pb-7 text-[10px] text-white/45 sm:px-10 sm:pb-8 lg:px-14">
        <p>
          Powered by <span className="font-semibold text-white/80">PARABLE</span> Enterprise
        </p>
        <p>Executive Demonstration v1.0</p>
      </footer>
    </main>
  );
}
