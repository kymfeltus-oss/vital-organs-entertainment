"use client";

import { ORB_ITEMS } from "@/components/awakening/constants";
import {
  EXPERIENCE_HUB_LAYOUT,
  layoutTop,
  layoutWidth,
} from "@/lib/experience/hub-design-tokens";
import { resolveHubOrbIcon } from "@/lib/experience/hub-orb-icons";
import OrbButton from "@/components/experience/hub/OrbButton";

type OrbRowProps = {
  desktop?: boolean;
};

export default function OrbRow({ desktop = false }: OrbRowProps) {
  const L = EXPERIENCE_HUB_LAYOUT.orbs;

  return (
    <nav
      className={
        desktop
          ? "absolute left-1/2 z-50 flex flex-nowrap"
          : "relative z-50 mx-auto mt-10 grid w-full max-w-[640px] grid-cols-2 gap-x-6 gap-y-8 px-4 pb-36 sm:max-w-none sm:flex sm:flex-wrap sm:justify-center sm:gap-8 lg:pb-0"
      }
      style={
        desktop
          ? {
              top: layoutTop(L.top),
              gap: layoutWidth(L.gap),
              transform: "translateX(-50%)",
            }
          : undefined
      }
      aria-label="Dashboard navigation orbs"
    >
      {ORB_ITEMS.map((orb, index) => (
        <OrbButton
          key={orb.id}
          title={orb.label}
          subtitle={orb.description}
          imageSrc={orb.image}
          imageFallback={"imageFallback" in orb ? orb.imageFallback : undefined}
          href={orb.href}
          fallbackIcon={resolveHubOrbIcon(orb.id)}
          delayIndex={index}
        />
      ))}
    </nav>
  );
}
