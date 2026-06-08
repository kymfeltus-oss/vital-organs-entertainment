"use client";

import { motion } from "framer-motion";
import AlbumCover from "@/components/AlbumCover";

const APPLE_MUSIC_URL = "https://music.apple.com/";

export default function MusicPage() {
  return (
    <main className="min-h-dvh w-full bg-[#0B090A] pt-safe pb-safe text-white">
      <div className="w-full px-4 py-6 md:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
            Music Release
          </p>
          <h1 className="mt-2 text-xl font-bold uppercase tracking-widest md:text-2xl">
            Hallelujah Anyhow!
          </h1>
          <p className="mt-2 text-sm text-zinc-400">The New Single</p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6"
        >
          <AlbumCover />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-lg font-bold uppercase tracking-[0.2em] text-[#1E40AF]"
        >
          Available Now!
        </motion.p>

        <motion.a
          href={APPLE_MUSIC_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          whileTap={{ scale: 0.98 }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#111111] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#1E40AF]/50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Listen on Apple Music
        </motion.a>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href={APPLE_MUSIC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-gradient-to-r from-[#1E40AF] to-[#B0267A] px-6 py-4 text-center text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_35px_rgba(176,38,122,0.45)] transition hover:brightness-110"
          >
            Stream Now
          </a>
          <button
            type="button"
            className="rounded-2xl border border-white/15 bg-[#111111] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:border-[#1E40AF]/50"
          >
            Lyrics
          </button>
          <button
            type="button"
            className="rounded-2xl border border-white/15 bg-[#111111] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:border-[#1E40AF]/50"
          >
            Share
          </button>
        </div>
      </div>
    </main>
  );
}
