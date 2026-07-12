import { LIV_BRAND_GRAPHICS_SEED_PRESETS } from "@/lib/enterprise/liv-golf/liv-brand-graphics";
import type { OwnerGraphicsPreset } from "@/lib/owner/graphics-data-plane";

export const LIV_GRAPHICS_ENTERPRISE_SCOPE = "liv-golf";

const LIV_GRAPHICS_KNOWN_PRIMARY_LABELS = new Set(
  LIV_BRAND_GRAPHICS_SEED_PRESETS.map((preset) =>
    typeof preset.contentPrimary === "string" ? preset.contentPrimary.trim().toUpperCase() : "",
  ).filter(Boolean),
);

function parsePresetMetadata(preset: Pick<OwnerGraphicsPreset, "content_secondary">): Record<string, unknown> | null {
  if (!preset.content_secondary?.trim().startsWith("{")) return null;

  try {
    return JSON.parse(preset.content_secondary) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** True when a graphics preset belongs to the LIV Golf enterprise deck (not Vital Organs). */
export function isLivGolfGraphicsPreset(preset: OwnerGraphicsPreset): boolean {
  const metadata = parsePresetMetadata(preset);
  if (metadata?.enterpriseScope === LIV_GRAPHICS_ENTERPRISE_SCOPE) {
    return true;
  }

  const primary = preset.content_primary?.trim().toUpperCase() ?? "";
  return LIV_GRAPHICS_KNOWN_PRIMARY_LABELS.has(primary);
}

export function filterLivGolfGraphicsPresets(presets: OwnerGraphicsPreset[]): OwnerGraphicsPreset[] {
  return presets.filter(isLivGolfGraphicsPreset);
}

/** Stamp LIV enterprise scope into encoded owner graphics metadata JSON. */
export function stampLivGraphicsEnterpriseScope(encodedMetadata: string): string {
  if (!encodedMetadata.trim().startsWith("{")) {
    return encodedMetadata;
  }

  try {
    const parsed = JSON.parse(encodedMetadata) as Record<string, unknown>;
    return JSON.stringify({
      ...parsed,
      enterpriseScope: LIV_GRAPHICS_ENTERPRISE_SCOPE,
    });
  } catch {
    return encodedMetadata;
  }
}
