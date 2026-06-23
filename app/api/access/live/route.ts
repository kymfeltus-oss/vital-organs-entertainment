import { NextResponse } from "next/server";
import { evaluateLiveAccessFromFlags, parseAccessContext } from "@/lib/access";
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

    const { data: streamState, error: streamError } = await admin
      .from("live_stream_state")
      .select("is_live")
      .eq("id", LIVE_STREAM_STATE_ID)
      .maybeSingle();

    if (streamError) {
      console.error("Live stream state load failed:", streamError.message);
      return NextResponse.json(
        { error: "Unable to evaluate live access." },
        { status: 500 },
      );
    }

    const evaluation = evaluateLiveAccessFromFlags(
      context.email,
      context.isGuest,
      false,
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
