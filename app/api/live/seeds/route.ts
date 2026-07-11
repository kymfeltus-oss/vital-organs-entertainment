import { NextRequest, NextResponse } from "next/server";
import { verifyGeoAttestationToken } from "@/lib/enterprise/liv-golf/geo/geo-attestation";
import {
  evaluateLivGeoEligibility,
  isLivGolfComplianceContext,
} from "@/lib/enterprise/liv-golf/geo/geo-eligibility";
import { GEO_INELIGIBLE_CODE } from "@/lib/enterprise/liv-golf/geo/types";
import { resolveAuthenticatedBuyer } from "@/lib/checkout/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthenticatedBuyer(request);

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (isLivGolfComplianceContext(request)) {
      const attestationHeader = request.headers.get("x-liv-geo-attestation");
      const latHeader = request.headers.get("x-liv-geo-lat");
      const lngHeader = request.headers.get("x-liv-geo-lng");
      const lat = latHeader ? Number(latHeader) : NaN;
      const lng = lngHeader ? Number(lngHeader) : NaN;

      const geoSample =
        Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, capturedAt: new Date().toISOString() } : null;

      const geoResult = evaluateLivGeoEligibility(request, geoSample);
      if (!geoResult.eligible) {
        return auth.withSessionCookies(
          NextResponse.json(
            { error: geoResult.reason, code: GEO_INELIGIBLE_CODE },
            { status: 403 },
          ),
        );
      }

      if (geoSample && attestationHeader) {
        const attestation = verifyGeoAttestationToken(attestationHeader, geoSample);
        if (attestation.ok === false) {
          return auth.withSessionCookies(
            NextResponse.json({ error: attestation.reason, code: "GEO_ATTESTATION_INVALID" }, { status: 403 }),
          );
        }
      }
    }

    const { buyer, withSessionCookies } = auth;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("seed_wallets")
      .select("balance, used_free_taps")
      .eq("user_id", buyer.userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load seed wallet:", error.message);
      return NextResponse.json(
        { error: "Unable to load seed balance." },
        { status: 500 },
      );
    }

    return withSessionCookies(
      NextResponse.json({
        balance: data?.balance ?? 0,
        usedFreeTaps: data?.used_free_taps ?? 0,
      }),
    );
  } catch (error) {
    console.error("Seed wallet route error:", error);
    return NextResponse.json(
      { error: "Unable to load seed balance." },
      { status: 500 },
    );
  }
}
