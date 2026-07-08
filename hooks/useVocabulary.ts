"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CURRENT_CHURCH_VOCABULARY,
  type ChurchVocabulary,
} from "@/lib/theme/church-vocabulary";
import { resolveClientTenantId } from "@/lib/theme/resolve-tenant-context";

export type SerializableVocabulary = {
  homeLabel: string;
  browseLabel: string;
  liveStageLabel: string;
  tokenShopLabel: string;
  supportLabel: string;
  intercessionButtonLabel: string;
  intercessionPlaceholder: string;
  intercessionSuccessNotice: string;
};

type VocabularyResponse = {
  ok?: boolean;
  tenantId?: string | null;
  vocabulary?: SerializableVocabulary;
  source?: string;
};

function toChurchVocabulary(serialized: SerializableVocabulary): ChurchVocabulary {
  return {
    ...CURRENT_CHURCH_VOCABULARY,
    ...serialized,
    seedSownNotification: (username: string) =>
      `${username} contributed a ${serialized.tokenShopLabel} support token! 🌾`,
    directGiftNotification: (username: string, amount: string) =>
      `${username} supported the sanctuary via ${serialized.supportLabel} with ${amount}! 🏺`,
  };
}

export type UseVocabularyResult = {
  vocabulary: ChurchVocabulary;
  loading: boolean;
  tenantId: string | null;
  source: "defaults" | "tenant_themes" | "cache";
  refresh: () => Promise<void>;
};

import { vocabularyCache } from "@/hooks/vocabulary-cache";

export function useVocabulary(tenantIdOverride?: string | null): UseVocabularyResult {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [vocabulary, setVocabulary] = useState<ChurchVocabulary>(CURRENT_CHURCH_VOCABULARY);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<UseVocabularyResult["source"]>("defaults");

  const resolvedTenantId = useMemo(() => {
    if (tenantIdOverride?.trim()) return tenantIdOverride.trim().toLowerCase();
    if (typeof window === "undefined") return null;
    return resolveClientTenantId();
  }, [tenantIdOverride]);

  const refresh = useCallback(async () => {
    const slug = resolvedTenantId;
    setTenantId(slug);
    setLoading(true);

    if (!slug) {
      setVocabulary(CURRENT_CHURCH_VOCABULARY);
      setSource("defaults");
      setLoading(false);
      return;
    }

    const cached = vocabularyCache.get(slug);
    if (cached) {
      setVocabulary(cached);
      setSource("cache");
    }

    try {
      const response = await fetch(`/api/tenant/vocabulary?tenantId=${encodeURIComponent(slug)}`, {
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as VocabularyResponse | null;

      if (response.ok && body?.vocabulary) {
        const next = toChurchVocabulary(body.vocabulary);
        vocabularyCache.set(slug, next);
        setVocabulary(next);
        setSource(body.source === "tenant_themes" ? "tenant_themes" : "defaults");
      } else if (!cached) {
        setVocabulary(CURRENT_CHURCH_VOCABULARY);
        setSource("defaults");
      }
    } catch {
      if (!cached) {
        setVocabulary(CURRENT_CHURCH_VOCABULARY);
        setSource("defaults");
      }
    } finally {
      setLoading(false);
    }
  }, [resolvedTenantId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { vocabulary, loading, tenantId, source, refresh };
}
