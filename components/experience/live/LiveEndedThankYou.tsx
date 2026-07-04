import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Music2 } from "lucide-react";
import { APPLE_MUSIC_SINGLE_URL } from "@/lib/music/assets";

const APPLE_MUSIC_EMBED_URL =
  "https://embed.music.apple.com/us/album/hallelujah-anyhow-single/1640220509";

/** Attendee end card shown immediately after the operator ends the broadcast. */
export default function LiveEndedThankYou() {
  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-[#020203] px-4 py-[max(1rem,env(safe-area-inset-top))] text-white sm:px-6 lg:grid lg:place-items-center lg:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(0,168,255,0.22),transparent_34%),radial-gradient(circle_at_82%_78%,rgba(255,47,175,0.2),transparent_38%),linear-gradient(145deg,#070813_0%,#020203_52%,#09020a_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:44px_44px]" />

      <section className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-white/12 bg-black/55 shadow-[0_28px_100px_rgba(0,0,0,0.72),0_0_55px_rgba(0,168,255,0.12)] backdrop-blur-xl md:grid-cols-[minmax(0,0.92fr)_minmax(22rem,1.08fr)]">
        <div className="relative min-h-[22rem] overflow-hidden md:min-h-[42rem]">
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

        <div className="relative flex flex-col justify-center px-5 py-7 sm:px-8 md:px-10 md:py-12">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 font-ui text-[0.58rem] font-black uppercase tracking-[0.16em] text-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Live experience complete
          </p>

          <h1 className="mt-5 font-headline text-[clamp(2.6rem,8vw,6.5rem)] uppercase leading-[0.82] tracking-[0.025em] text-white">
            Thank You
            <span className="block bg-gradient-to-r from-[#18c9ff] via-[#8075ff] to-[#ff3da8] bg-clip-text text-transparent">
              For Watching
            </span>
          </h1>
          <p className="mt-5 max-w-xl font-body text-base leading-relaxed text-white/72 sm:text-lg">
            From Ian Craig &amp; 300 and the entire Awakening family—thank you for worshiping,
            sowing, and sharing this moment with us.
          </p>

          <div className="mt-7 rounded-2xl border border-white/12 bg-white/[0.045] p-3 shadow-inner">
            <div className="mb-3 flex items-center gap-3 px-1">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#00a8ff] to-[#ff2faf] text-white">
                <Music2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-ui text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#ff64bb]">
                  Keep the praise going
                </p>
                <p className="font-body text-sm text-white/70">Play “Hallelujah Anyhow”</p>
              </div>
            </div>
            <iframe
              title="Play Hallelujah Anyhow by Ian Craig and 300 on Apple Music"
              src={APPLE_MUSIC_EMBED_URL}
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
              className="h-[175px] w-full overflow-hidden rounded-xl border-0 bg-black"
            />
            <p className="mt-2 px-1 font-body text-[0.65rem] text-white/40">
              Music preview provided courtesy of Apple Music. Press play if your browser blocks sound.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
