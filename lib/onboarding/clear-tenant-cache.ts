import { clearTenantTheme } from "@/lib/theme/tenant-theme-store";
import { clearServerTenantTheme } from "@/lib/theme/theme-server-store";

const clientVocabularyCaches = new Map<string, unknown>();

/** Drop in-memory tenant caches so the next request loads fresh branding. */
export function clearTenantRuntimeCache(tenantId: string): void {
  const normalized = tenantId.trim().toLowerCase();
  if (!normalized) return;

  clearTenantTheme(normalized);
  clientVocabularyCaches.delete(normalized);
}

/** Register a client-side vocabulary cache bucket (optional hook for hooks/useVocabulary). */
export function registerClientVocabularyCache(
  tenantId: string,
  cache: Map<string, unknown>,
): void {
  clientVocabularyCaches.set(tenantId.trim().toLowerCase(), cache);
}

export function invalidateClientVocabularyCache(tenantId: string): void {
  const normalized = tenantId.trim().toLowerCase();
  const cache = clientVocabularyCaches.get(normalized);
  if (cache instanceof Map) {
    cache.delete(normalized);
  }
}

/** Best-effort server memory reset after provisioning. */
export function clearGlobalThemeMemory(): void {
  clearServerTenantTheme();
}
