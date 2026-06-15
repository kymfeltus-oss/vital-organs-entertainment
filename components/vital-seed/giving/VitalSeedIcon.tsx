import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  VITAL_SEED_GIVING_ASSETS,
  type VitalSeedGivingAssetKey,
} from "@/lib/vital-seed/giving-assets";

type VitalSeedIconProps = {
  asset: Exclude<
    VitalSeedGivingAssetKey,
    "desktopBackground" | "mobileBackground"
  >;
  alt: string;
  className?: string;
  style?: CSSProperties;
};

export default function VitalSeedIcon({ asset, alt, className, style }: VitalSeedIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={VITAL_SEED_GIVING_ASSETS[asset]}
      alt={alt}
      className={cn("vital-giving-icon", className)}
      style={style}
      draggable={false}
    />
  );
}
