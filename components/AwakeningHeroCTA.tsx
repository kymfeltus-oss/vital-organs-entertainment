"use client";

import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { cn } from "@/lib/utils";

type AwakeningHeroCTAProps = {
  variant?: "mobile" | "desktop";
};

export default function AwakeningHeroCTA({ variant = "desktop" }: AwakeningHeroCTAProps) {
  const isMobile = variant === "mobile";

  return (
    <section
      className={cn(
        "awakening-hero-cta relative mx-auto w-full text-center",
        isMobile ? "max-w-full px-3 py-3" : "max-w-6xl px-4 py-6",
      )}
    >
      <h2
        className={cn(
          "relative z-10 font-headline leading-[0.92] text-white drop-shadow-[0_0_22px_rgba(255,255,255,0.55)]",
          isMobile
            ? "text-[clamp(1.55rem,6.8vw,2.15rem)] tracking-[0.05em]"
            : "text-[clamp(3.4rem,9vw,7.5rem)] leading-[0.9] tracking-[0.08em]",
        )}
      >
        THE AWAKENING IS OPEN
      </h2>

      <p
        className={cn(
          "relative z-10 font-ui font-semibold text-white/85",
          isMobile
            ? "mx-auto mt-2 max-w-[18rem] text-[0.58rem] leading-relaxed tracking-[0.2em]"
            : "mt-3 text-[clamp(0.75rem,1.8vw,1.05rem)] tracking-[0.45em]",
        )}
      >
        STEP INTO WORSHIP, PURPOSE AND IMPACT.
      </p>

      <div
        className={cn(
          "relative z-10 flex flex-col items-stretch justify-center",
          isMobile ? "mx-auto mt-4 w-full max-w-[20rem] gap-2.5" : "mt-6 flex flex-col items-center gap-4 md:flex-row",
        )}
      >
        <Link
          href={ATTENDEE_DASHBOARD_PATH}
          className={cn(
            "group relative flex w-full items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/55 font-headline tracking-[0.14em] text-white shadow-[inset_0_0_18px_rgba(255,255,255,0.12),0_0_24px_rgba(30,64,175,0.85),0_0_34px_rgba(176,38,122,0.75)] transition hover:scale-[1.02]",
            isMobile ? "h-12 px-4 text-[0.95rem]" : "h-16 max-w-md px-8 text-3xl tracking-[0.18em]",
          )}
        >
          <span
            className="absolute inset-0 rounded-full bg-gradient-to-r from-[#1E40AF] via-transparent to-[#B0267A] opacity-80"
            aria-hidden
          />
          <span className="absolute inset-[3px] rounded-full bg-black/80" aria-hidden />
          <span className="relative z-10 whitespace-nowrap">ENTER EXPERIENCE</span>
          <ChevronRight
            className={cn(
              "relative z-10 ml-2 shrink-0 transition group-hover:translate-x-1",
              isMobile ? "h-5 w-5" : "ml-4 h-8 w-8",
            )}
          />
        </Link>

        <Link
          href="/story"
          className={cn(
            "group flex w-full items-center justify-center rounded-full border border-white/70 bg-black/45 font-headline font-bold tracking-[0.08em] text-white shadow-[0_0_18px_rgba(176,38,122,0.35)] transition hover:scale-[1.02] hover:bg-white/10",
            isMobile ? "h-11 px-4 text-[0.68rem]" : "h-14 max-w-xs px-6 text-sm",
          )}
        >
          <span className="whitespace-nowrap">WATCH IAN&apos;S STORY</span>
          <span
            className={cn(
              "ml-2 flex shrink-0 items-center justify-center rounded-full border border-white/80",
              isMobile ? "h-6 w-6" : "ml-3 h-7 w-7",
            )}
          >
            <Play className={cn("fill-white", isMobile ? "ml-0.5 h-3 w-3" : "ml-0.5 h-3.5 w-3.5")} />
          </span>
        </Link>
      </div>
    </section>
  );
}
