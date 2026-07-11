import type { CreateGraphicsPresetPayload } from "@/lib/owner/graphics-data-plane";

/** LIV Golf brand overlay layer configs — seed into `owner_graphics_presets` via /owner/graphics. */
export type LivBrandGraphicLayer = {
  layer_id: string;
  bg_color?: string;
  accent?: string;
  logo_asset?: string;
  animation?: string;
  video_source?: string;
  unskippable?: boolean;
  audio_level?: number;
  opacity?: number;
};

export const LIV_BRAND_GRAPHIC_LAYERS: Record<"sponsor" | "commercial", LivBrandGraphicLayer> = {
  sponsor: {
    layer_id: "rolex-lower-third",
    bg_color: "#111111",
    accent: "#CCFF00",
    logo_asset: "rolex_gold_crown.png",
    animation: "slide-up-bounce",
  },
  commercial: {
    layer_id: "premium-ad-takeover",
    video_source: "liv_commercial_loop_1080p.mp4",
    unskippable: true,
    audio_level: 1.0,
  },
};

/** Default owner graphics preset payloads for LIV enterprise studio deck buttons. */
export const LIV_BRAND_GRAPHICS_SEED_PRESETS: readonly CreateGraphicsPresetPayload[] = [
  {
    type: "LOWER_THIRD",
    contentPrimary: "ROLEX",
    contentSecondary: "Official Timekeeper • LIV Golf",
    durationSeconds: 0,
    layoutMode: "lower_third",
    positionAnchor: "BOTTOM_LEFT",
    imageUrl: "/images/liv-golf/rolex-gold-crown.png",
  },
  {
    type: "SLATE",
    contentPrimary: "LIV GOLF PRESENTED BY",
    contentSecondary: "Premium Partner Break",
    durationSeconds: 30,
    layoutMode: "fullscreen",
    positionAnchor: "FULLSCREEN",
    mediaUrl: "/video/liv-commercial-loop-1080p.mp4",
  },
  {
    type: "TICKER",
    contentPrimary: "LIV FAN TOKENS",
    contentSecondary: "Place in-stream micro-bets during live tournament coverage",
    durationSeconds: 0,
    layoutMode: "ticker",
    positionAnchor: "BOTTOM_LEFT",
  },
] as const;
