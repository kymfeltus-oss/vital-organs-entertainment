import { loadTenantBrandingConfig } from "@/lib/admin/tenant-branding-config";
import {
  CURRENT_CHURCH_VOCABULARY,
  type ChurchVocabulary,
} from "@/lib/theme/church-vocabulary";

/** Server-side vocabulary resolver — merges tenant white-label overrides with defaults. */
export async function getChurchVocabulary(tenantId: string): Promise<ChurchVocabulary> {
  const config = await loadTenantBrandingConfig(tenantId);
  if (!config) return CURRENT_CHURCH_VOCABULARY;

  const tokenShopLabel = config.customTokenName || CURRENT_CHURCH_VOCABULARY.tokenShopLabel;
  const supportLabel = config.customGivingName || CURRENT_CHURCH_VOCABULARY.supportLabel;

  return {
    ...CURRENT_CHURCH_VOCABULARY,
    homeLabel: config.customMembersName || CURRENT_CHURCH_VOCABULARY.homeLabel,
    browseLabel: config.customEventsName || CURRENT_CHURCH_VOCABULARY.browseLabel,
    tokenShopLabel,
    supportLabel,
    seedSownNotification: (username: string) =>
      `${username} contributed a ${tokenShopLabel} support token! 🌾`,
    directGiftNotification: (username: string, amount: string) =>
      `${username} supported the sanctuary via ${supportLabel} with ${amount}! 🏺`,
  };
}
