import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  GraphicsPlacementAnchor,
  GraphicsPresetType,
  OWNER_GRAPHICS_DEFAULT_THEME,
  OWNER_GRAPHICS_EVENT_ID,
} from "@/lib/owner/graphics-data-plane";

export type ProgramGraphicTheme = {
  cornerRadiusPx: number;
  paddingPx: number;
  backgroundOpacityPercent: number;
  placementAnchor: GraphicsPlacementAnchor;
  customLogoUrl: string | null;
};

export type ProgramGraphic = {
  id: string;
  type: GraphicsPresetType;
  contentPrimary: string;
  contentSecondary: string;
  durationSeconds: number;
  updatedAt: string;
  theme: ProgramGraphicTheme;
};

type PresetRow = {
  id: string;
  type: GraphicsPresetType;
  content_primary: string;
  content_secondary: string | null;
  duration_seconds: number;
  created_at: string;
};

type ThemeRow = {
  corner_radius_px: number;
  padding_px: number;
  background_opacity_percent: number;
  placement_anchor: GraphicsPlacementAnchor;
  custom_logo_url: string | null;
};

export async function loadActiveProgramGraphic(): Promise<ProgramGraphic | null> {
  const admin = getSupabaseAdmin();

  const [{ data: preset, error: presetError }, { data: theme, error: themeError }] =
    await Promise.all([
      admin
        .from("owner_graphics_presets")
        .select("id, type, content_primary, content_secondary, duration_seconds, created_at")
        .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
        .eq("is_active_on_stream", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("owner_graphics_global_theme")
        .select(
          "corner_radius_px, padding_px, background_opacity_percent, placement_anchor, custom_logo_url",
        )
        .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
        .maybeSingle(),
    ]);

  if (presetError) throw new Error(presetError.message);
  if (themeError) throw new Error(themeError.message);
  if (!preset) return null;

  const presetRow = preset as PresetRow;
  const themeRow = theme as ThemeRow | null;

  return {
    id: presetRow.id,
    type: presetRow.type,
    contentPrimary: presetRow.content_primary,
    contentSecondary: presetRow.content_secondary ?? "",
    durationSeconds: presetRow.duration_seconds,
    updatedAt: presetRow.created_at,
    theme: {
      cornerRadiusPx: themeRow?.corner_radius_px ?? OWNER_GRAPHICS_DEFAULT_THEME.corner_radius_px,
      paddingPx: themeRow?.padding_px ?? OWNER_GRAPHICS_DEFAULT_THEME.padding_px,
      backgroundOpacityPercent:
        themeRow?.background_opacity_percent ??
        OWNER_GRAPHICS_DEFAULT_THEME.background_opacity_percent,
      placementAnchor: themeRow?.placement_anchor ?? OWNER_GRAPHICS_DEFAULT_THEME.placement_anchor,
      customLogoUrl: themeRow?.custom_logo_url ?? OWNER_GRAPHICS_DEFAULT_THEME.custom_logo_url,
    },
  };
}
