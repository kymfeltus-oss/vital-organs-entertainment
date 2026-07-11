import { NextRequest, NextResponse } from "next/server";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import { isValidEmail } from "@/lib/auth/validation";
import { findTenantIdByOwnerEmail, registerOrResumeTenantOwner } from "@/lib/onboarding/owner-auth";
import { tenantUrlForId } from "@/lib/onboarding/onboarding-theme";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler-client";
import { getMarketingPlatformHost } from "@/lib/theme/platform-domains";

export const dynamic = "force-dynamic";

type AccountBody = {
  companyName?: string;
  ownerEmail?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  const json = (payload: Record<string, unknown>, status = 200) =>
    NextResponse.json(payload, { status });

  try {
    const body = (await request.json()) as AccountBody;
    const companyName = body.companyName?.trim() ?? "";
    const ownerEmail = body.ownerEmail?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!companyName || companyName.length < 2) {
      return json({ ok: false, error: "Company name is required." }, 400);
    }

    if (!isValidEmail(ownerEmail)) {
      return json({ ok: false, error: "A valid owner email is required." }, 400);
    }

    const { supabase, getResponse } = createRouteHandlerSupabaseClient(request, () =>
      json({ ok: true }),
    );

    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    let userId = sessionUser?.id ?? null;
    let resumed = false;

    if (!sessionUser?.email || sessionUser.email.toLowerCase() !== ownerEmail) {
      const passwordStrength = evaluatePasswordStrength(password);
      if (!passwordStrength.isValid) {
        return json(
          {
            ok: false,
            error: passwordStrength.message ?? "Password does not meet security requirements.",
          },
          400,
        );
      }

      const authResult = await registerOrResumeTenantOwner(ownerEmail, password, {
        company_name: companyName,
      });

      if (authResult.ok === false) {
        return json(
          {
            ok: false,
            error: authResult.message,
            code: authResult.code ?? "auth_failed",
            loginUrl: `/onboarding/login?email=${encodeURIComponent(ownerEmail)}&next=${encodeURIComponent("/onboarding")}`,
          },
          authResult.code === "email_exists" ? 409 : 400,
        );
      }

      userId = authResult.userId;
      resumed = Boolean(authResult.resumed);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: ownerEmail,
        password,
      });

      if (signInError) {
        return json({ ok: false, error: signInError.message }, 401);
      }
    }

    const existingTenantId = await findTenantIdByOwnerEmail(ownerEmail);
    const platformHost = getMarketingPlatformHost();

    if (existingTenantId) {
      const response = getResponse();
      const payload = {
        ok: true,
        resumed,
        userId,
        onboardingComplete: true,
        skipToStep: 3 as const,
        tenantId: existingTenantId,
        tenantUrl: tenantUrlForId(existingTenantId, platformHost),
        message: "Account linked. Your sanctuary node is already provisioned.",
      };
      return NextResponse.json(payload, { status: 200, headers: response.headers });
    }

    const response = getResponse();
    return NextResponse.json(
      {
        ok: true,
        resumed,
        userId,
        onboardingComplete: false,
        skipToStep: 2 as const,
        message: resumed
          ? "Welcome back. Continue with your subdomain allocation."
          : "Account provisioned. Continue with your subdomain allocation.",
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    console.error("[onboarding/account] failed:", error);
    return json({ ok: false, error: "Unable to provision account." }, 500);
  }
}
