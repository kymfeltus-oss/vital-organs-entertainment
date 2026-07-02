"use client";

import { useCallback, useState } from "react";
import type { SeedBillingPackageId } from "@/lib/billing-config";
import { getClientAppUrl } from "@/lib/client-api";

type UseSeedCheckoutResult = {
  isSubmitting: boolean;
  errorMessage: string | null;
  activePackageId: SeedBillingPackageId | null;
  startCheckout: (
    packageId: SeedBillingPackageId,
    options?: { returnPath?: string },
  ) => Promise<void>;
  clearError: () => void;
};

function normalizeReturnPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "/live" || trimmed.startsWith("/live?")) return "/live";
  if (trimmed === "/buy-seeds" || trimmed.startsWith("/buy-seeds?")) return "/buy-seeds";
  return null;
}

export function useSeedCheckout(): UseSeedCheckoutResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePackageId, setActivePackageId] = useState<SeedBillingPackageId | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const startCheckout = useCallback(async (packageId: SeedBillingPackageId, options?: { returnPath?: string }) => {
    setIsSubmitting(true);
    setActivePackageId(packageId);
    setErrorMessage(null);

    const returnPath = normalizeReturnPath(options?.returnPath);

    try {
      const response = await fetch(`${getClientAppUrl()}/api/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          packageId,
          ...(returnPath ? { returnPath } : {}),
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (response.status === 401) {
        setErrorMessage("Sign in at the email gate before checkout.");
        return;
      }

      if (!response.ok || !data.url) {
        setErrorMessage(data.error ?? "Unable to start checkout. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setErrorMessage("Unable to reach checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
      setActivePackageId(null);
    }
  }, []);

  return {
    isSubmitting,
    errorMessage,
    activePackageId,
    startCheckout,
    clearError,
  };
}
