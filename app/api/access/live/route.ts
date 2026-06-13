import { NextResponse } from "next/server";
import { evaluateLiveAccessFromFlags, parseAccessContext } from "@/lib/access";
import { isAdminPrepAccessOverrideEmail } from "@/lib/access/admin-prep-override";
import { isLiveAccessDevBypassEnabled } from "@/lib/access/live-dev-bypass";
import { LIVE_STREAM_ACCESS_PRODUCT_IDS } from "@/lib/merch/catalog";
import { LIVE_STREAM_STATE_ID } from "@/lib/live/types";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const context = parseAccessContext(user);

    if (!context.email) {
      return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const [{ data: orders, error: orderError }, { data: streamState, error: streamError }] =
      await Promise.all([
        admin
          .from("orders")
          .select("id, product_type")
          .eq("email", context.email)
          .eq("status", "paid")
          .in("product_type", [...LIVE_STREAM_ACCESS_PRODUCT_IDS]),
        admin
          .from("live_stream_state")
          .select("is_live")
          .eq("id", LIVE_STREAM_STATE_ID)
          .maybeSingle(),
      ]);

    if (orderError) {
      console.error("Live pass verification failed:", orderError.message);
      return NextResponse.json(
        { error: "Unable to verify live pass." },
        { status: 500 },
      );
    }

    if (streamError) {
      console.error("Live stream state load failed:", streamError.message);
      return NextResponse.json(
        { error: "Unable to evaluate live access." },
        { status: 500 },
      );
    }

    const devBypass = isLiveAccessDevBypassEnabled();
    // Temporary event preparation access override.
    const adminPrepOverride = isAdminPrepAccessOverrideEmail(context.email);
    const hasPaidPass =
      devBypass ||
      adminPrepOverride ||
      (Array.isArray(orders) && orders.length > 0);
    const evaluation = evaluateLiveAccessFromFlags(
      context.email,
      context.isGuest,
      hasPaidPass,
    );

    const streamIsLive = streamState?.is_live === true;

    return NextResponse.json({
      ...evaluation,
      userId: context.userId,
      streamIsLive,
      playbackUrl: "",
    });
  } catch (error) {
    console.error("Live access route error:", error);
    return NextResponse.json(
      { error: "Unable to evaluate live access." },
      { status: 500 },
    );
  }
}
