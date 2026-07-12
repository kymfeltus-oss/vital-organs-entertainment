import { NextResponse } from "next/server";
import { seedLivBrandGraphics } from "@/lib/enterprise/liv-golf/seed-liv-brand-graphics";
import { requireOwnerUser } from "@/lib/owner/auth";
import { isOwnerAuthed, ownerAuthFailureResponse } from "@/lib/owner/api-response";
import { emitStreamGraphicsSync } from "@/lib/owner/emit-stream-graphics-sync";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Seed LIV Rolex / commercial graphics presets into the owner graphics deck. */
export async function POST() {
  const auth = await requireOwnerUser();
  if (!isOwnerAuthed(auth)) return ownerAuthFailureResponse(auth);

  try {
    const admin = getSupabaseAdmin();
    const { created, skipped } = await seedLivBrandGraphics(admin);
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
