import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import {
  loadTenantBrandingConfig,
  saveTenantBrandingConfig,
  type TenantBrandingConfig,
} from "@/lib/admin/tenant-branding-config";
import { TENANT_ID_COOKIE, TENANT_ID_HEADER } from "@/lib/theme/tenant-id-constants";
import { resolveServerTenantId } from "@/lib/theme/resolve-tenant-context";

export const dynamic = "force-dynamic";

async function resolveTenantId(explicit?: string | null): Promise<string | null> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const cookiePairs = cookieStore
    .getAll()
    .map((entry) => `${entry.name}=${entry.value}`)
    .join("; ");

  return resolveServerTenantId({
    explicit,
    tenantHeader: headerStore.get(TENANT_ID_HEADER),
    host: headerStore.get("host"),
    cookieHeader: cookiePairs || cookieStore.get(TENANT_ID_COOKIE)?.value,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = await resolveTenantId(searchParams.get("tenantId"));

  if (!tenantId) {
    return NextResponse.json(
      {
        error:
          "Tenant context is required. Use your ministry subdomain, add ?tenantId=your-slug, or enter your slug in the connect panel.",
      },
      { status: 400 },
    );
  }

  const config = await loadTenantBrandingConfig(tenantId);
  if (!config) {
    return NextResponse.json(
      { error: `No branding row found for tenant "${tenantId}". Complete onboarding first.` },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, config });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = body as Partial<TenantBrandingConfig> & { tenantId?: string };
  const tenantId = await resolveTenantId(payload.tenantId ?? null);

  if (!tenantId) {
    return NextResponse.json(
      {
        error:
          "Tenant context is required. Use your ministry subdomain, add ?tenantId=your-slug, or enter your slug in the connect panel.",
      },
      { status: 400 },
    );
  }

  const ministryName = typeof payload.ministryName === "string" ? payload.ministryName : "";
  const customGivingName =
    typeof payload.customGivingName === "string" ? payload.customGivingName : "";
  const customTokenName =
    typeof payload.customTokenName === "string" ? payload.customTokenName : "";
  const customEventsName =
    typeof payload.customEventsName === "string" ? payload.customEventsName : "";
  const customMembersName =
    typeof payload.customMembersName === "string" ? payload.customMembersName : "";
  const primaryColor = typeof payload.primaryColor === "string" ? payload.primaryColor : "";
  const secondaryColor =
    typeof payload.secondaryColor === "string" ? payload.secondaryColor : "";
  const tagline = typeof payload.tagline === "string" ? payload.tagline : "";
  const accentGlow = typeof payload.accentGlow === "string" ? payload.accentGlow : "";

  if (!ministryName.trim()) {
    return NextResponse.json({ error: "Ministry / church name is required." }, { status: 400 });
  }

  const result = await saveTenantBrandingConfig({
    tenantId,
    ministryName,
    customGivingName,
    customTokenName,
    customEventsName,
    customMembersName,
    primaryColor,
    secondaryColor,
    tagline,
    accentGlow,
  });

  if (result.ok === false) {
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  const config = await loadTenantBrandingConfig(tenantId);
  return NextResponse.json({ ok: true, config });
}
