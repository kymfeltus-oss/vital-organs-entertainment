import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { LIV_BRAND_GRAPHICS_SEED_PRESETS } from "@/lib/enterprise/liv-golf/liv-brand-graphics";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse } from "@/lib/owner/api-response";
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
import { emitStreamGraphicsSync } from "@/lib/owner/emit-stream-graphics-sync";

export const dynamic = "force-dynamic";

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
    content_secondary: encodeGraphicsPresetMetadata({
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
    duration_seconds: normalizeDurationSeconds(body.durationSeconds),
    is_active_on_stream: false,
  };
}

/** Seed LIV Rolex / commercial graphics presets into the owner graphics deck. */
export async function POST() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const admin = getSupabaseAdmin();
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

    await emitStreamGraphicsSync();

    return NextResponse.json({
      success: true,
      created,
      skipped,
      message: "LIV brand graphics presets seeded.",
    });
  } catch (error) {
    console.error("[enterprise/liv-golf/graphics/seed] POST failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to seed graphics." },
      { status: 500 },
    );
  }
}
