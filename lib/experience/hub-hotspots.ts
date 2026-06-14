/** Transparent hit targets aligned to the approved dashboard mockup plate. */

export type HubLinkHotspot = {
  id: string;
  label: string;
  href: string;
  /** Absolute positioning classes — tuned to 300-awakening-dashboard-bg.png */
  position: string;
};

export const HUB_AMBIENT_HOTSPOT = {
  id: "ambient-worship",
  label: "Ambient Worship",
  position:
    "left-[clamp(0.75rem,3vw,1.25rem)] bottom-[calc(0.65rem+env(safe-area-inset-bottom))] h-[clamp(2.75rem,7vh,3.5rem)] w-[clamp(9rem,34vw,13rem)] rounded-full",
} as const;

export const HUB_LINK_HOTSPOTS: HubLinkHotspot[] = [
  {
    id: "watch-full-story",
    label: "Watch Full Story",
    href: "/experience/music",
    position:
      "left-[4%] top-[33%] h-[27%] w-[92%] sm:left-[8%] sm:top-[31%] sm:h-[29%] sm:w-[84%] lg:left-[12%] lg:top-[30%] lg:h-[30%] lg:w-[76%]",
  },
  {
    id: "giving",
    label: "Vital Seed Giving",
    href: "/experience/giving",
    position:
      "left-[5%] bottom-[10%] h-[clamp(4.5rem,14vh,6.5rem)] w-[18%] rounded-full sm:left-[6%] sm:bottom-[11%] sm:w-[17%]",
  },
  {
    id: "single",
    label: "New Single Out Now",
    href: "/experience/music",
    position:
      "left-[27%] bottom-[10%] h-[clamp(4.5rem,14vh,6.5rem)] w-[18%] rounded-full sm:left-[28%] sm:bottom-[11%] sm:w-[17%]",
  },
  {
    id: "connected",
    label: "Stay Connected",
    href: "/updates",
    position:
      "left-[51%] bottom-[10%] h-[clamp(4.5rem,14vh,6.5rem)] w-[18%] rounded-full sm:left-[52%] sm:bottom-[11%] sm:w-[17%]",
  },
  {
    id: "encourage",
    label: "Encourage Ian",
    href: "/experience/prayer",
    position:
      "left-[75%] bottom-[10%] h-[clamp(4.5rem,14vh,6.5rem)] w-[18%] rounded-full sm:left-[76%] sm:bottom-[11%] sm:w-[17%]",
  },
];

export const HOTSPOT_HIT_CLASS =
  "absolute touch-target border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";
