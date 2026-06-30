import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler-client";

export async function POST(request: NextRequest) {
  const { supabase, getResponse } = createRouteHandlerSupabaseClient(
    request,
    () => NextResponse.json({ success: true }),
  );

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: "Unable to sign out." }, { status: 500 });
  }

  return getResponse();
}
