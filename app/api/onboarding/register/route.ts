import { NextRequest, NextResponse } from "next/server";
import { evaluatePasswordStrength } from "@/lib/auth/password-policy";
import { isValidEmail } from "@/lib/auth/validation";
import {
  insertTenantThemeRow,
  isTenantIdAvailable,
  registerTenantOwnerAccount,
  uploadTenantLogo,
} from "@/lib/onboarding/tenant-themes-repository";
import { findTenantIdByOwnerEmail } from "@/lib/onboarding/owner-auth";
import { isValidTenantId, normalizeTenantId } from "@/lib/onboarding/tenant-id";
import { getMarketingPlatformHost } from "@/lib/theme/platform-domains";

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_COLOR_PATTERN.test(trimmed)) return null;
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const companyName = formData.get("companyName")?.toString().trim() ?? "";
    const ownerEmail = formData.get("ownerEmail")?.toString().trim().toLowerCase() ?? "";
    const password = formData.get("password")?.toString() ?? "";
    const tenantIdRaw = formData.get("tenantId")?.toString() ?? "";
    const primaryColorRaw = formData.get("primaryColor")?.toString() ?? "#2563eb";
    const logoEntry = formData.get("logo");
    const logoFile = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null;

    if (!companyName || companyName.length < 2) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    if (!isValidEmail(ownerEmail)) {
      return NextResponse.json({ error: "A valid owner email is required." }, { status: 400 });
    }

    const passwordStrength = evaluatePasswordStrength(password);
    if (!passwordStrength.isValid) {
      return NextResponse.json(
        { error: passwordStrength.message ?? "Password does not meet security requirements." },
        { status: 400 },
      );
    }

    if (!isValidTenantId(tenantIdRaw)) {
      return NextResponse.json({ error: "Choose a valid subdomain." }, { status: 400 });
    }

    const tenantId = normalizeTenantId(tenantIdRaw);
    const primaryColor = normalizeHexColor(primaryColorRaw);
    if (!primaryColor) {
      return NextResponse.json({ error: "Primary color must be a valid hex value." }, { status: 400 });
    }

    if (logoFile && logoFile.size > MAX_LOGO_BYTES) {
      return NextResponse.json({ error: "Logo must be 5MB or smaller." }, { status: 400 });
    }

    const available = await isTenantIdAvailable(tenantId);
    if (!available) {
      return NextResponse.json({ error: "That subdomain is already taken." }, { status: 409 });
    }

    const authResult = await registerTenantOwnerAccount(ownerEmail, password, {
      company_name: companyName,
      tenant_id: tenantId,
    });

    if (authResult.ok === false) {
      const status = authResult.code === "email_exists" ? 409 : 400;
      return NextResponse.json(
        {
          error: authResult.message,
          code: authResult.code ?? "auth_failed",
          loginUrl: `/onboarding/login?email=${encodeURIComponent(ownerEmail)}&next=${encodeURIComponent("/onboarding")}`,
        },
        { status },
      );
    }

    const existingTenantId = await findTenantIdByOwnerEmail(ownerEmail);
    if (existingTenantId) {
      const platformHost = getMarketingPlatformHost();
      const tenantUrl =
        platformHost === "localhost:3000" || platformHost.startsWith("localhost:")
          ? `http://${existingTenantId}.${platformHost}`
          : `https://${existingTenantId}.${platformHost}`;

      return NextResponse.json({
        ok: true,
        tenantId: existingTenantId,
        tenantUrl,
        alreadyProvisioned: true,
        message: "Your sanctuary node is already provisioned for this account.",
      });
    }

    let logoUrl: string | null = null;
    if (logoFile) {
      const uploadResult = await uploadTenantLogo(tenantId, logoFile);
      if (uploadResult.ok === false) {
        return NextResponse.json({ error: uploadResult.message }, { status: 500 });
      }
      logoUrl = uploadResult.url;
    }

    const insertResult = await insertTenantThemeRow({
      tenantId,
      companyName,
      ownerEmail,
      ownerUserId: authResult.userId,
      primaryColor,
      logoUrl,
    });

    if (insertResult.ok === false) {
      return NextResponse.json({ error: insertResult.message }, { status: 500 });
    }

    const platformHost = getMarketingPlatformHost();
    const tenantUrl =
      platformHost === "localhost:3000"
        ? `http://${tenantId}.localhost:3000`
        : `https://${tenantId}.${platformHost}`;

    return NextResponse.json({
      ok: true,
      tenantId,
      tenantUrl,
      message: "Your branded network has been registered.",
    });
  } catch (error) {
    console.error("[onboarding/register] failed:", error);
    return NextResponse.json({ error: "Unable to complete onboarding." }, { status: 500 });
  }
}
