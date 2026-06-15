import { cn } from "@/lib/utils";
import {
  VITAL_SEED_GIVING_ASSETS,
  VITAL_SEED_GIVING_DESKTOP_ART,
  VITAL_SEED_GIVING_MOBILE_ART,
} from "@/lib/vital-seed/giving-assets";
import type { GivingVariant } from "@/lib/experience/giving-layout-slots";

type VitalSeedBackgroundProps = {
  variant: GivingVariant;
};

export default function VitalSeedBackground({ variant }: VitalSeedBackgroundProps) {
  const isDesktop = variant === "desktop";
  const src = isDesktop
    ? VITAL_SEED_GIVING_ASSETS.desktopBackground
    : VITAL_SEED_GIVING_ASSETS.mobileBackground;
  const art = isDesktop ? VITAL_SEED_GIVING_DESKTOP_ART : VITAL_SEED_GIVING_MOBILE_ART;

  return (
    <div
      className={cn(
        "vital-giving-artboard",
        isDesktop
          ? "vital-giving-artboard--desktop hidden lg:block"
          : "vital-giving-artboard--mobile lg:hidden",
      )}
      style={{ aspectRatio: `${art.width} / ${art.height}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="vital-giving-artboard__img" />
    </div>
  );
}
