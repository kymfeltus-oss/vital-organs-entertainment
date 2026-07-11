import { NextRequest, NextResponse } from "next/server";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import { isValidEmail } from "@/lib/auth/validation";
import { registerOrResumeTenantOwner } from "@/lib/onboarding/owner-auth";
import { normalizeHexColor } from "@/lib/onboarding/onboarding-theme";
import { provisionTenantInfrastructure } from "@/lib/onboarding/provision-tenant";
import { isValidTenantId, normalizeTenantId } from "@/lib/onboarding/tenant-id";
import { uploadTenantLogo } from "@/lib/onboarding/tenant-themes-repository";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler-client";

export const dynamic = "force-dynamic";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

type InitializeJsonBody = {
  companyName?: string;
  ownerEmail?: string;
  password?: string;
  tenantId?: string;
  primaryColor?: string;
  tier?: string;
};

async function resolveOwnerUserId(
  request: NextRequest,
  ownerEmail: string,
  password: string,
  companyName: string,
): Promise<
  | { ok: true; userId: string; sessionHeaders?: Headers }
  | { ok: false; response: NextResponse }
> {
  const { supabase, getResponse } = createRouteHandlerSupabaseClient(request, () =>
    NextResponse.json({ ok: true }),
  );

  const {
    data: { user: sessionUser },
  } = await supabase.auth.getUser();

  if (sessionUser?.id && sessionUser.email?.toLowerCase() === ownerEmail) {
    return { ok: true, userId: sessionUser.id };
  }

  const passwordStrength = evaluatePasswordStrength(password);
  if (!passwordStrength.isValid) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: passwordStrength.message ?? "Password does not meet security requirements.",
        },
        { status: 400 },
      ),
    };
  }

  const authResult = await registerOrResumeTenantOwner(ownerEmail, password, {
    company_name: companyName,
  });

  if (authResult.ok === false) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: authResult.message,
          code: authResult.code ?? "auth_failed",
          loginUrl: `/onboarding/login?email=${encodeURIComponent(ownerEmail)}&next=${encodeURIComponent("/onboarding")}`,
        },
        { status: authResult.code === "email_exists" ? 409 : 400 },
      ),
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password,
  });

  if (signInError) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: signInError.message }, { status: 401 }),
    };
  }

  const sessionResponse = getResponse();
  return { ok: true, userId: authResult.userId, sessionHeaders: sessionResponse.headers };
}

function jsonWithOptionalSession(
  payload: Record<string, unknown>,
  sessionHeaders?: Headers,
  status = 200,
): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: sessionHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      return handleMultipartInitialize(request);
    }

    const body = (await request.json()) as InitializeJsonBody;
    const companyName = body.companyName?.trim() ?? "";
    const ownerEmail = body.ownerEmail?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const tenantIdRaw = body.tenantId ?? "";
    const primaryColorRaw = body.primaryColor ?? "#F5B400";
    const tier = body.tier?.trim() || "starter";

    if (!companyName || companyName.length < 2) {
      return NextResponse.json({ ok: false, error: "Company name is required." }, { status: 400 });
    }

    if (!isValidEmail(ownerEmail)) {
      return NextResponse.json({ ok: false, error: "A valid owner email is required." }, { status: 400 });
    }

    if (!isValidTenantId(tenantIdRaw)) {
      return NextResponse.json({ ok: false, error: "Choose a valid subdomain." }, { status: 400 });
    }

    const tenantId = normalizeTenantId(tenantIdRaw);
    const primaryColor = normalizeHexColor(primaryColorRaw);
    if (!primaryColor) {
      return NextResponse.json(
        { ok: false, error: "Primary color must be a valid hex value." },
        { status: 400 },
      );
    }

    const owner = await resolveOwnerUserId(request, ownerEmail, password, companyName);
    if (owner.ok === false) {
      return owner.response;
    }

    const provisioned = await provisionTenantInfrastructure({
      tenantId,
      companyName,
      ownerEmail,
      ownerUserId: owner.userId,
      primaryColor,
      tier,
      logoUrl: null,
    });

    if (provisioned.ok === false) {
      return NextResponse.json(
        { ok: false, error: provisioned.message, code: provisioned.code },
        { status: provisioned.code === "subdomain_taken" ? 409 : 500 },
      );
    }

    return jsonWithOptionalSession(
      {
        ok: true,
        tenantId: provisioned.tenantId,
        tenantUrl: provisioned.tenantUrl,
        theme: provisioned.theme,
        alreadyProvisioned: provisioned.alreadyProvisioned ?? false,
        message: provisioned.alreadyProvisioned
          ? "Your sanctuary node is already live."
          : "Infrastructure initialized successfully.",
      },
      owner.sessionHeaders,
    );
  } catch (error) {
    console.error("[onboarding/initialize] failed:", error);
    return NextResponse.json({ ok: false, error: "Unable to initialize infrastructure." }, { status: 500 });
  }
}

async function handleMultipartInitialize(request: NextRequest) {
  const formData = await request.formData();

  const companyName = formData.get("companyName")?.toString().trim() ?? "";
  const ownerEmail = formData.get("ownerEmail")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const tenantIdRaw = formData.get("tenantId")?.toString() ?? "";
  const primaryColorRaw = formData.get("primaryColor")?.toString() ?? "#F5B400";
  const tier = formData.get("tier")?.toString().trim() || "starter";
  const logoEntry = formData.get("logo");
  const logoFile = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null;

  if (!companyName || companyName.length < 2) {
    return NextResponse.json({ ok: false, error: "Company name is required." }, { status: 400 });
  }

  if (!isValidEmail(ownerEmail)) {
    return NextResponse.json({ ok: false, error: "A valid owner email is required." }, { status: 400 });
  }

  if (!isValidTenantId(tenantIdRaw)) {
    return NextResponse.json({ ok: false, error: "Choose a valid subdomain." }, { status: 400 });
  }

  const tenantId = normalizeTenantId(tenantIdRaw);
  const primaryColor = normalizeHexColor(primaryColorRaw);
  if (!primaryColor) {
    return NextResponse.json(
      { ok: false, error: "Primary color must be a valid hex value." },
      { status: 400 },
    );
  }

  if (logoFile && logoFile.size > MAX_LOGO_BYTES) {
    return NextResponse.json({ ok: false, error: "Logo must be 5MB or smaller." }, { status: 400 });
  }

  const owner = await resolveOwnerUserId(request, ownerEmail, password, companyName);
  if (owner.ok === false) {
    return owner.response;
  }

  let logoUrl: string | null = null;
  if (logoFile) {
    const uploadResult = await uploadTenantLogo(tenantId, logoFile);
    if (uploadResult.ok === false) {
      return NextResponse.json({ ok: false, error: uploadResult.message }, { status: 500 });
    }
    logoUrl = uploadResult.url;
  }

  const provisioned = await provisionTenantInfrastructure({
    tenantId,
    companyName,
    ownerEmail,
    ownerUserId: owner.userId,
    primaryColor,
    tier,
    logoUrl,
  });

  if (provisioned.ok === false) {
    return NextResponse.json(
      { ok: false, error: provisioned.message, code: provisioned.code },
      { status: provisioned.code === "subdomain_taken" ? 409 : 500 },
    );
  }

  return jsonWithOptionalSession(
    {
      ok: true,
      tenantId: provisioned.tenantId,
      tenantUrl: provisioned.tenantUrl,
      theme: provisioned.theme,
      alreadyProvisioned: provisioned.alreadyProvisioned ?? false,
      message: provisioned.alreadyProvisioned
        ? "Your sanctuary node is already live."
        : "Infrastructure initialized successfully.",
    },
    owner.sessionHeaders,
  );
}
