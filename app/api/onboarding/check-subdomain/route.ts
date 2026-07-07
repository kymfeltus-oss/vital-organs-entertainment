import { NextRequest, NextResponse } from "next/server";
import { isTenantIdAvailable } from "@/lib/onboarding/tenant-themes-repository";
import { isValidTenantId, normalizeTenantId } from "@/lib/onboarding/tenant-id";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim() ?? "";

  if (!isValidTenantId(tenantId)) {
    return NextResponse.json({
      available: false,
      tenantId: normalizeTenantId(tenantId),
      message: "Use 3–32 lowercase letters, numbers, or hyphens.",
    });
  }

  const normalized = normalizeTenantId(tenantId);
  const available = await isTenantIdAvailable(normalized);

  return NextResponse.json({
    available,
    tenantId: normalized,
    message: available ? "Subdomain is available." : "That subdomain is already taken.",
  });
}
