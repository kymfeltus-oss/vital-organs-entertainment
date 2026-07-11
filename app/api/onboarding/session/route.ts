import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler-client";
import { findTenantIdByOwnerEmail } from "@/lib/onboarding/owner-auth";
import { getMarketingPlatformHost } from "@/lib/theme/platform-domains";

export const dynamic = "force-dynamic";

function tenantUrlForId(tenantId: string): string {
  const platformHost = getMarketingPlatformHost();
  if (platformHost === "localhost:3000" || platformHost.startsWith("localhost:")) {
    return `http://${tenantId}.${platformHost}`;
  }
  return `https://${tenantId}.${platformHost}`;
}

export async function GET(request: NextRequest) {
  const json = (payload: Record<string, unknown>, status = 200) =>
    NextResponse.json(payload, { status });

  const { supabase } = createRouteHandlerSupabaseClient(request, () => json({ ok: true }));
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return json({ loggedIn: false });
  }

  const accountType =
    typeof user.user_metadata?.account_type === "string"
      ? user.user_metadata.account_type
      : null;

  const tenantId = await findTenantIdByOwnerEmail(user.email);

  return json({
    loggedIn: true,
    email: user.email,
    accountType,
    tenantId,
    tenantUrl: tenantId ? tenantUrlForId(tenantId) : null,
    onboardingComplete: Boolean(tenantId),
  });
}
