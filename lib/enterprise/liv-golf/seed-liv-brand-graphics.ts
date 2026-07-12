import type { SupabaseClient } from "@supabase/supabase-js";
import { LIV_BRAND_GRAPHICS_SEED_PRESETS } from "@/lib/enterprise/liv-golf/liv-brand-graphics";
import { stampLivGraphicsEnterpriseScope } from "@/lib/enterprise/liv-golf/liv-graphics-scope";
import {
  defaultGraphicsMetadataForKind,
  encodeGraphicsPresetMetadata,
  graphicsBuilderKindToPresetType,
  normalizeDurationSeconds,
  normalizeGraphicLayoutMode,
  normalizeGraphicPercent,
  normalizeGraphicPositionAnchor,
  normalizeGraphicsBuilderKind,
  normalizeGraphicZIndex,
  OWNER_GRAPHICS_EVENT_ID,
  type CreateGraphicsPresetPayload,
} from "@/lib/owner/graphics-data-plane";

function buildPresetInsert(body: CreateGraphicsPresetPayload) {
  const builderKind = normalizeGraphicsBuilderKind(body.type);
  const contentPrimary =
    typeof body.contentPrimary === "string" ? body.contentPrimary.trim().slice(0, 120) : "";

  if (!builderKind || !contentPrimary) return null;

  const baseMetadata = defaultGraphicsMetadataForKind(builderKind);

  return {
    event_id: OWNER_GRAPHICS_EVENT_ID,
    type: graphicsBuilderKindToPresetType(builderKind),
    content_primary: contentPrimary,
    content_secondary: stampLivGraphicsEnterpriseScope(
      encodeGraphicsPresetMetadata({
        ...baseMetadata,
        builderKind,
        secondaryText:
          typeof body.contentSecondary === "string" ? body.contentSecondary.trim().slice(0, 260) : null,
        layoutMode: normalizeGraphicLayoutMode(body.layoutMode, builderKind),
        positionAnchor: normalizeGraphicPositionAnchor(body.positionAnchor),
        xPercent: normalizeGraphicPercent(body.xPercent, baseMetadata.xPercent),
        yPercent: normalizeGraphicPercent(body.yPercent, baseMetadata.yPercent),
        widthPercent: normalizeGraphicPercent(body.widthPercent, baseMetadata.widthPercent, 5, 100),
        heightPercent: normalizeGraphicPercent(body.heightPercent, baseMetadata.heightPercent, 5, 100),
        zIndex: normalizeGraphicZIndex(body.zIndex),
        mediaUrl: typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : null,
        imageUrl: typeof body.imageUrl === "string" ? body.imageUrl.trim() : null,
      }),
    ),
    duration_seconds: normalizeDurationSeconds(body.durationSeconds),
    is_active_on_stream: false,
  };
}

export type SeedLivBrandGraphicsResult = {
  created: string[];
  skipped: string[];
};

/** Insert LIV Rolex / commercial presets when missing from the owner graphics deck. */
export async function seedLivBrandGraphics(admin: SupabaseClient): Promise<SeedLivBrandGraphicsResult> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const seed of LIV_BRAND_GRAPHICS_SEED_PRESETS) {
    const row = buildPresetInsert(seed);
    if (!row) continue;

    const { data: existing } = await admin
      .from("owner_graphics_presets")
      .select("id")
      .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
      .eq("content_primary", row.content_primary)
      .eq("type", row.type)
      .maybeSingle();

    if (existing?.id) {
      skipped.push(row.content_primary);
      continue;
    }

    const { error } = await admin.from("owner_graphics_presets").insert(row);
    if (error) throw new Error(error.message);
    created.push(row.content_primary);
  }

  return { created, skipped };
}
