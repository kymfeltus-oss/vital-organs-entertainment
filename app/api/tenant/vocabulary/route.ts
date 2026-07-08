import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { getChurchVocabulary } from "@/lib/theme/get-church-vocabulary";
import { resolveServerTenantId } from "@/lib/theme/resolve-tenant-context";
import { TENANT_ID_COOKIE, TENANT_ID_HEADER } from "@/lib/theme/tenant-id-constants";
import { CURRENT_CHURCH_VOCABULARY } from "@/lib/theme/church-vocabulary";
import type { ChurchVocabulary } from "@/lib/theme/church-vocabulary";

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

function serializeVocabulary(vocabulary: ChurchVocabulary) {
  return {
    homeLabel: vocabulary.homeLabel,
    browseLabel: vocabulary.browseLabel,
    liveStageLabel: vocabulary.liveStageLabel,
    tokenShopLabel: vocabulary.tokenShopLabel,
    supportLabel: vocabulary.supportLabel,
    intercessionButtonLabel: vocabulary.intercessionButtonLabel,
    intercessionPlaceholder: vocabulary.intercessionPlaceholder,
    intercessionSuccessNotice: vocabulary.intercessionSuccessNotice,
  };
}

/** Read-only tenant vocabulary for attendee surfaces and live player UI. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = await resolveTenantId(searchParams.get("tenantId"));

  if (!tenantId) {
    return NextResponse.json({
      ok: true,
      tenantId: null,
      vocabulary: serializeVocabulary(CURRENT_CHURCH_VOCABULARY),
      source: "defaults",
    });
  }

  const vocabulary = await getChurchVocabulary(tenantId);
  return NextResponse.json({
    ok: true,
    tenantId,
    vocabulary: serializeVocabulary(vocabulary),
    source: "tenant_themes",
  });
}
