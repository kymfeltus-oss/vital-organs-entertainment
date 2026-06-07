"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAudio } from "@/app/context/AudioContext";

const SPLASH_FALLBACK = "/images/awakening-splash.png";

type SplashImageProps = {
  src: string;
  className: string;
  objectPosition?: string;
};

function SplashImage({ src, className, objectPosition = "center" }: SplashImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <img
      src={currentSrc}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ objectPosition }}
      onError={() => {
        if (currentSrc !== SPLASH_FALLBACK) {
          setCurrentSrc(SPLASH_FALLBACK);
        }
      }}
    />
  );
}

export default function AwakeningLaunch() {
  const router = useRouter();
  const { playTrack } = useAudio();

  const handleEnter = useCallback(async () => {
    try {
      await playTrack();
    } catch {
      /* gesture consumed; audio may require retry on next tap */
    }
    router.push("/experience");
  }, [playTrack, router]);

  return (
    <main className="relative h-dvh min-h-screen w-full overflow-hidden bg-black">
      <SplashImage
        src="/images/mobile-splash.png"
        className="absolute inset-0 h-full w-full object-cover md:hidden"
        objectPosition="center top"
      />
      <SplashImage
        src="/images/desktop-splash.png"
        className="absolute inset-0 hidden h-full w-full object-cover md:block"
        objectPosition="center 42%"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 md:from-black/45 md:via-transparent md:to-black/45 lg:from-black/55 lg:to-black/55"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[20%] h-48 w-72 -translate-x-1/2 animate-pulse rounded-full bg-[radial-gradient(circle,rgba(255,0,180,0.35)_0%,rgba(0,220,255,0.12)_45%,transparent_72%)] blur-2xl sm:top-[18%] md:top-[16%] md:h-56 md:w-96"
      />

      <div className="pointer-events-none absolute left-1/2 top-[14%] z-10 w-[min(82vw,360px)] -translate-x-1/2 sm:top-[12%] md:top-[10%]">
        <img
          src="/logo.png"
          alt="300 Awakening"
          className="mx-auto w-full drop-shadow-[0_0_40px_rgba(255,0,180,0.75)]"
        />
      </div>

      <div className="absolute bottom-[8%] left-1/2 z-20 w-full -translate-x-1/2 px-6 pb-safe">
        <motion.button
          type="button"
          onClick={handleEnter}
          whileTap={{ scale: 0.97 }}
          className="animate-enter-glow mx-auto block rounded-full border border-pink-400/80 bg-black/25 px-16 py-5 text-sm font-semibold uppercase tracking-[0.35em] text-white backdrop-blur-sm"
        >
          Enter
        </motion.button>
      </div>
    </main>
  );
}
