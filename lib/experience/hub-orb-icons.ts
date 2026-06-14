import type { LucideIcon } from "lucide-react";
import { Heart, MessageCircleHeart, Music2, Users } from "lucide-react";

const ORB_ICON_MAP: Record<string, LucideIcon> = {
  giving: Heart,
  single: Music2,
  connected: Users,
  encourage: MessageCircleHeart,
};

/** Spec-sheet orb glow rings keyed by orb slug. */
export function hubOrbShellClasses(slug: string): string {
  switch (slug) {
    case "giving":
      return "border border-[#7B2DFF]/70 shadow-[0_0_24px_rgba(123,45,255,0.55),0_0_40px_rgba(123,45,255,0.25)] bg-[#7B2DFF12]";
    case "single":
      return "border border-[#FF007F]/70 shadow-[0_0_24px_rgba(255,0,127,0.55),0_0_40px_rgba(255,0,127,0.25)] bg-[#FF007F12]";
    case "connected":
      return "border border-[#00E6FF]/70 shadow-[0_0_24px_rgba(0,230,255,0.55),0_0_40px_rgba(0,230,255,0.22)] bg-[#00E6FF10]";
    case "encourage":
      return "border border-[#FF2DFF]/70 shadow-[0_0_24px_rgba(255,45,255,0.55),0_0_40px_rgba(255,0,127,0.22)] bg-[#FF2DFF12]";
    default:
      return "border border-[#00E6FF]/70 shadow-[0_0_20px_#00E6FF] bg-brand-panel/85";
  }
}

export function hubOrbIconClasses(slug: string): string {
  switch (slug) {
    case "giving":
      return "text-[#7B2DFF]";
    case "single":
      return "text-[#FF007F]";
    case "connected":
      return "text-[#00E6FF]";
    case "encourage":
      return "text-[#FF2DFF]";
    default:
      return "text-[#00E6FF]";
  }
}

export function resolveHubOrbIcon(iconKey: string): LucideIcon {
  return ORB_ICON_MAP[iconKey] ?? Heart;
}

export function resolveHubOrbSlug(orb: { id: string; iconKey: string }): string {
  if (orb.iconKey in ORB_ICON_MAP) return orb.iconKey;
  return orb.id;
}
