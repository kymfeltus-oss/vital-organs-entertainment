"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Music2, Play } from "lucide-react";
import { APPLE_MUSIC_SINGLE_URL } from "@/lib/music/assets";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

const LIVE_END_MUSIC_URL = "/media/intro-music.m4a";

/** Attendee end card shown immediately after the operator ends the broadcast. */
export default function LiveEndedThankYou() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.82;
    void audio.play().then(
      () => setAutoplayBlocked(false),
      () => setAutoplayBlocked(true),
    );
  }, []);

  const startMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    void audio.play().then(
      () => setAutoplayBlocked(false),
      () => setAutoplayBlocked(true),
    );
  };

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#020203] text-white sm:px-6 sm:py-[max(1rem,env(safe-area-inset-top))] lg:grid lg:place-items-center lg:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(0,168,255,0.22),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(255,47,175,0.2),transparent_38%),linear-gradient(145deg,#070813_0%,#020203_52%,#09020a_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:44px_44px]" />

      <section className="relative mx-auto grid min-h-dvh w-full max-w-5xl overflow-hidden bg-black/55 shadow-[0_28px_100px_rgba(0,0,0,0.72),0_0_55px_rgba(0,168,255,0.12)] backdrop-blur-xl sm:min-h-0 sm:rounded-[1.75rem] sm:border sm:border-white/12 md:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)]">
        <div className="relative h-[38dvh] min-h-[18rem] max-h-[24rem] overflow-hidden md:h-auto md:max-h-none md:min-h-[42rem]">
          <Image
            src="/music/hallelujah-anyhow-cover.png"
            alt="Hallelujah Anyhow by Ian Craig and 300"
            fill
            priority
            sizes="(min-width: 768px) 46vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/70" />
        </div>

        <div className="relative z-10 -mt-8 flex flex-col justify-center rounded-t-[2rem] bg-gradient-to-b from-black via-black/95 to-black px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 sm:-mt-10 sm:px-8 md:mt-0 md:rounded-none md:bg-none md:px-10 md:py-12">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 font-ui text-[0.58rem] font-black uppercase tracking-[0.16em] text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Live experience complete
          </p>

          <h1 className="mt-4 font-headline text-[clamp(2.35rem,11vw,4.25rem)] uppercase leading-[0.82] tracking-[0.025em] text-white sm:mt-5 md:text-[clamp(2.6rem,8vw,6.5rem)]">
            Thank You
            <span className="block bg-gradient-to-r from-[#18c9ff] via-[#8075ff] to-[#ff3da8] bg-clip-text text-transparent">
              For Watching
            </span>
          </h1>
          <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-white/72 sm:mt-5 sm:text-lg">
            Thank you for watching, sowing, and sharing this moment with {PLATFORM_APP_NAME}.
          </p>

          <div className="mt-5 rounded-2xl border border-white/12 bg-white/[0.045] p-3 shadow-inner sm:mt-7">
            <div className="mb-3 flex items-center gap-3 px-1">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#00a8ff] to-[#ff2faf] text-white">
                <Music2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-ui text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#ff64bb]">
                  Thank-you soundtrack
                </p>
                <p className="font-body text-sm text-white/70">Event soundtrack</p>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={LIVE_END_MUSIC_URL}
              autoPlay
              controls
              preload="auto"
              className="h-12 w-full rounded-full accent-[#ff3da8]"
              aria-label="Event soundtrack"
              onPlay={() => setAutoplayBlocked(false)}
            />
            {autoplayBlocked ? (
              <button
                type="button"
                onClick={startMusic}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#ff3da8]/45 bg-[#ff3da8]/10 px-4 font-ui text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#ff75c1] transition hover:bg-[#ff3da8]/20"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Play Thank-You Music
              </button>
            ) : null}
            <p className="mt-2 px-1 font-body text-[0.65rem] text-white/40">
              The song starts automatically when allowed by the viewer&apos;s browser.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2">
            <a
              href={APPLE_MUSIC_SINGLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#087fff] to-[#db2f9e] px-5 font-ui text-[0.66rem] font-black uppercase tracking-[0.1em] text-white transition hover:brightness-110"
            >
              Open in Apple Music
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              href="/program"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.04] px-5 font-ui text-[0.66rem] font-black uppercase tracking-[0.1em] text-white/80 transition hover:border-white/40 hover:text-white"
            >
              View The Program
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
