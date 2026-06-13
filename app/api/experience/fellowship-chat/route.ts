import { NextRequest, NextResponse } from "next/server";
import { FELLOWSHIP_MAX_CONTENT_LENGTH } from "@/lib/experience/fellowship-chat";
import {
  assertFellowshipSlowMode,
  buildFellowshipSession,
  loadActiveMuteUntil,
  loadFellowshipChatFeed,
} from "@/lib/experience/fellowship-chat-server";
import { resolveAuthenticatedBuyer } from "@/lib/checkout/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/ssr-server";

type FellowshipChatPostBody = {
  content?: string;
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = getSupabaseAdmin();
    const [feed, session] = await Promise.all([
      loadFellowshipChatFeed(admin),
      buildFellowshipSession(admin, user),
    ]);

    return NextResponse.json({
      messages: feed.messages,
      pinned: feed.pinned,
      session,
    });
  } catch (error) {
    console.error("Fellowship chat feed load failed:", error);
    return NextResponse.json(
      { error: "Unable to load Fellowship Chat." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedBuyer(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Sign in to join chat." },
        { status: 401 },
      );
    }

    const { buyer, withSessionCookies } = auth;
    const body = (await request.json()) as FellowshipChatPostBody;
    const content = body.content?.trim();

    if (!content || content.length > FELLOWSHIP_MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        {
          error: `Message must be between 1 and ${FELLOWSHIP_MAX_CONTENT_LENGTH} characters.`,
        },
        { status: 400 },
      );
    }

    const admin = getSupabaseAdmin();
    const mutedUntil = await loadActiveMuteUntil(admin, buyer.userId);

    if (mutedUntil) {
      return NextResponse.json(
        { error: "You are temporarily muted in Fellowship Chat." },
        { status: 403 },
      );
    }

    const slowMode = await assertFellowshipSlowMode(admin, buyer.userId);
    if (slowMode.ok === false) {
      return NextResponse.json({ error: slowMode.error }, { status: 429 });
    }

    const { data, error } = await admin
      .from("chat_messages")
      .insert({
        user_id: buyer.userId,
        email: buyer.email,
        content,
        is_pinned: false,
      })
      .select(
        "id, user_id, email, content, created_at, deleted_at, is_pinned, pinned_at",
      )
      .single();

    if (error || !data) {
      console.error("Fellowship chat insert failed:", error?.message);
      return NextResponse.json(
        { error: "Unable to send message." },
        { status: 500 },
      );
    }

    return withSessionCookies(NextResponse.json({ message: data }));
  } catch (error) {
    console.error("Fellowship chat POST failed:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
