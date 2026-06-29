export const OWNER_GRAPHICS_EVENT_ID = "300-awakening";

export const OWNER_GRAPHICS_DEFAULT_THEME = {
  event_id: OWNER_GRAPHICS_EVENT_ID,
  corner_radius_px: 8,
  padding_px: 24,
  background_opacity_percent: 80,
  placement_anchor: "BOTTOM_LEFT" as GraphicsPlacementAnchor,
  custom_logo_url: null as string | null,
};

export const GRAPHICS_PRESET_TYPES = [
  "LOWER_THIRD",
  "OFFERING",
  "SCRIPTURE",
  "SLATE",
  "TICKER",
] as const;

export type GraphicsPresetType = (typeof GRAPHICS_PRESET_TYPES)[number];

export type GraphicsPlacementAnchor =
  | "TOP_LEFT"
  | "TOP_RIGHT"
  | "BOTTOM_LEFT"
  | "BOTTOM_RIGHT"
  | "CENTER";

export type OwnerGraphicsPreset = {
  id: string;
  event_id: string;
  type: GraphicsPresetType;
  content_primary: string;
  content_secondary: string | null;
  is_active_on_stream: boolean;
  duration_seconds: number;
  created_at: string;
};

export type OwnerGraphicsTheme = {
  id: string;
  event_id: string;
  corner_radius_px: number;
  padding_px: number;
  background_opacity_percent: number;
  placement_anchor: GraphicsPlacementAnchor;
  custom_logo_url: string | null;
  updated_at: string;
};

export type CreateGraphicsPresetPayload = {
  type?: unknown;
  contentPrimary?: unknown;
  contentSecondary?: unknown;
  durationSeconds?: unknown;
};

export type UpdateGraphicsPresetPayload = {
  id?: unknown;
  isActiveOnStream?: unknown;
};

export type UpdateGraphicsThemePayload = {
  action?: unknown;
  cornerRadiusPx?: unknown;
  paddingPx?: unknown;
  backgroundOpacityPercent?: unknown;
  placementAnchor?: unknown;
  customLogoUrl?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function cleanGraphicsUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) ? trimmed : null;
}

export function cleanGraphicsText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeGraphicsPresetType(value: unknown): GraphicsPresetType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "_");
  return GRAPHICS_PRESET_TYPES.includes(normalized as GraphicsPresetType)
    ? (normalized as GraphicsPresetType)
    : null;
}

export function normalizeDurationSeconds(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : 0;

  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(3600, Math.trunc(parsed)));
}

export function normalizeBoundedInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed =
    typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : fallback;

  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

export function normalizePlacementAnchor(value: unknown): GraphicsPlacementAnchor {
  if (
    value === "TOP_LEFT" ||
    value === "TOP_RIGHT" ||
    value === "BOTTOM_LEFT" ||
    value === "BOTTOM_RIGHT" ||
    value === "CENTER"
  ) {
    return value;
  }

  return OWNER_GRAPHICS_DEFAULT_THEME.placement_anchor;
}

export function formatGraphicsTypeLabel(type: GraphicsPresetType): string {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function getGraphicsTypeHelp(type: GraphicsPresetType): {
  primary: string;
  secondary: string;
  placeholderPrimary: string;
  placeholderSecondary: string;
} {
  switch (type) {
    case "LOWER_THIRD":
      return {
        primary: "Main Text",
        secondary: "Subtitle / Role",
        placeholderPrimary: "PASTOR IAN CRAIG",
        placeholderSecondary: "LEAD PASTOR",
      };
    case "OFFERING":
      return {
        primary: "Offering Callout",
        secondary: "Giving Details",
        placeholderPrimary: "WAYS TO GIVE",
        placeholderSecondary: 'TEXT "300" TO 77977',
      };
    case "SCRIPTURE":
      return {
        primary: "Scripture Reference",
        secondary: "Scripture Text",
        placeholderPrimary: "JOHN 3:16",
        placeholderSecondary: "For God so loved the world...",
      };
    case "SLATE":
      return {
        primary: "Slate Headline",
        secondary: "Slate Support Copy",
        placeholderPrimary: "STARTING SOON",
        placeholderSecondary: "Service begins in moments",
      };
    case "TICKER":
      return {
        primary: "Ticker Lead",
        secondary: "Ticker Sequence",
        placeholderPrimary: "WELCOME TO 300 AWAKENING",
        placeholderSecondary: "FOLLOW US @300AWAKENING",
      };
  }
}
