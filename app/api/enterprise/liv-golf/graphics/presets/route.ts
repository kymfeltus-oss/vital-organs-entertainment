import { NextResponse } from "next/server";
import { filterLivGolfGraphicsPresets, isLivGolfGraphicsPreset } from "@/lib/enterprise/liv-golf/liv-graphics-scope";
import { seedLivBrandGraphics } from "@/lib/enterprise/liv-golf/seed-liv-brand-graphics";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse } from "@/lib/owner/api-response";
import { emitStreamGraphicsSync } from "@/lib/owner/emit-stream-graphics-sync";
import { OWNER_GRAPHICS_EVENT_ID, type OwnerGraphicsPreset } from "@/lib/owner/graphics-data-plane";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isMissingGraphicsTable(error: unknown) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /owner_graphics_presets|does not exist|schema cache|42P01|PGRST205/i.test(message);
}

async function loadAllGraphicsPresets(): Promise<OwnerGraphicsPreset[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("owner_graphics_presets")
    .select("*")
    .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingGraphicsTable(error)) return [];
    throw new Error(error.message);
  }

  return (data ?? []) as OwnerGraphicsPreset[];
}

/** LIV Golf studio graphics deck — Vital Organs presets are excluded. */
export async function GET() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    let presets = filterLivGolfGraphicsPresets(await loadAllGraphicsPresets());

    if (presets.length === 0) {
      const admin = getSupabaseAdmin();
      await seedLivBrandGraphics(admin);
      presets = filterLivGolfGraphicsPresets(await loadAllGraphicsPresets());
    }

    return NextResponse.json({ success: true, presets });
  } catch (error) {
    console.error("[enterprise/liv-golf/graphics/presets] GET failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to load LIV graphics." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const body = (await request.json()) as { id?: unknown; isActiveOnStream?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    const isActiveOnStream = body.isActiveOnStream;

    if (!id || typeof isActiveOnStream !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid graphic update." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: preset, error: loadError } = await admin
      .from("owner_graphics_presets")
      .select("*")
      .eq("id", id)
      .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
      .maybeSingle();

    if (loadError) throw new Error(loadError.message);
    if (!preset || !isLivGolfGraphicsPreset(preset as OwnerGraphicsPreset)) {
      return NextResponse.json(
        { success: false, error: "Only LIV Golf graphics presets can be toggled from this studio." },
        { status: 403 },
      );
    }

    if (isActiveOnStream) {
      const livPresets = filterLivGolfGraphicsPresets(await loadAllGraphicsPresets());
      const livActiveIds = livPresets.filter((row) => row.is_active_on_stream).map((row) => row.id);

      if (livActiveIds.length > 0) {
        const { error: clearError } = await admin
          .from("owner_graphics_presets")
          .update({ is_active_on_stream: false })
          .in("id", livActiveIds);

        if (clearError) throw new Error(clearError.message);
      }
    }

    const { data, error } = await admin
      .from("owner_graphics_presets")
      .update({ is_active_on_stream: isActiveOnStream })
      .eq("id", id)
      .eq("event_id", OWNER_GRAPHICS_EVENT_ID)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    await emitStreamGraphicsSync();

    return NextResponse.json({ success: true, preset: data as OwnerGraphicsPreset });
  } catch (error) {
    console.error("[enterprise/liv-golf/graphics/presets] PATCH failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to update LIV graphic." },
      { status: 500 },
    );
  }
}
