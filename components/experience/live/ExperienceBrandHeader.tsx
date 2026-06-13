"use client";

import Image from "next/image";
import { EXPERIENCE_BRAND_ASSETS } from "@/lib/experience/brand-assets";

type ExperienceBrandHeaderProps = {
  compact?: boolean;
  liveBadge?: boolean;
};

export default function ExperienceBrandHeader({
  compact = false,
  liveBadge = false,
}: ExperienceBrandHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={`relative shrink-0 ${
            compact
              ? "h-8 w-[min(6.5rem,34vw)] sm:h-9 sm:w-28"
              : "h-9 w-[min(7.5rem,38vw)] sm:h-10 sm:w-32"
          }`}
        >
          <Image
            src={EXPERIENCE_BRAND_ASSETS.logo}
            alt="Vital Organs Entertainment"
            fill
            priority
            sizes="(max-width: 768px) 34vw, 128px"
            className="object-contain object-left"
          />
        </div>
        <div className="min-w-0 md:hidden">
          <p className="truncate font-ui text-[0.48rem] font-bold uppercase tracking-[0.2em] exp-text-blue">
            Live Experience
          </p>
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.24em] exp-text-blue">
            Vital Organs Entertainment
          </p>
          <h1 className="mt-0.5 truncate font-headline text-base uppercase tracking-[0.14em] text-white">
            300 Awakening Live Experience
          </h1>
        </div>
      </div>

      {liveBadge ? (
        <span className="experience-live-badge inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
          <span className="font-ui text-[0.5rem] font-bold uppercase tracking-[0.14em] text-red-400">
            Live
          </span>
        </span>
      ) : null}
    </div>
  );
}
