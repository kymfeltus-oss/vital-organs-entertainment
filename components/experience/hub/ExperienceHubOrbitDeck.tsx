"use client";

import Link from "next/link";
import type { ExperienceHubOrb } from "@/lib/experience/hub-content";
import { hubSpecClasses } from "@/lib/experience/hub-design-tokens";
import {
  hubOrbIconClasses,
  hubOrbShellClasses,
  resolveHubOrbIcon,
  resolveHubOrbSlug,
} from "@/lib/experience/hub-orb-icons";

type ExperienceHubOrbitDeckProps = {
  orbs: ExperienceHubOrb[];
};

export default function ExperienceHubOrbitDeck({ orbs }: ExperienceHubOrbitDeckProps) {
  return (
    <section className="relative mx-auto mt-[clamp(1.25rem,3.5vw,2rem)] w-full max-w-[min(100%,56rem)] pb-20">
      <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 sm:gap-x-6">
        {orbs.map((orb) => {
          const Icon = resolveHubOrbIcon(orb.iconKey);
          const slug = resolveHubOrbSlug(orb);

          return (
            <Link
              key={orb.id}
              href={orb.href}
              className="group flex flex-col items-center text-center"
            >
              <div
                className={`relative flex aspect-square w-[clamp(5rem,18vw,7.5rem)] items-center justify-center rounded-full backdrop-blur-md transition duration-300 group-hover:scale-[1.04] ${hubOrbShellClasses(slug)}`}
              >
                <Icon
                  className={`h-[clamp(1.35rem,5vw,1.85rem)] w-[clamp(1.35rem,5vw,1.85rem)] ${hubOrbIconClasses(slug)}`}
                  strokeWidth={1.4}
                  aria-hidden="true"
                />
              </div>
              <h3
                className={`mt-3 ${hubSpecClasses.label} text-[0.58rem] leading-snug tracking-[0.12em] text-white`}
              >
                {orb.label}
              </h3>
              <p
                className={`mt-1 max-w-[9.5rem] ${hubSpecClasses.body} text-[0.62rem] leading-relaxed`}
              >
                {orb.subtext}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
