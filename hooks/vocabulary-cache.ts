import type { ChurchVocabulary } from "@/lib/theme/church-vocabulary";

export const vocabularyCache = new Map<string, ChurchVocabulary>();

export function clearVocabularyCache(tenantId?: string): void {
  if (tenantId) {
    vocabularyCache.delete(tenantId.trim().toLowerCase());
    return;
  }
  vocabularyCache.clear();
}
