"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";

const BUY_SEEDS_PATH = "/buy-seeds";

type UseIanCraigLiveSeedActionsOptions = {
  /** Opens the in-stream giving sheet (`ExperienceGivingPanel` / Stripe checkout). */
  onOpenGiveSheet: () => void;
};

/**
 * Live seed wallet + action handlers for the Ian Craig LIVE dashboard.
 * - `handleAddSeeds` → `/buy-seeds` (merch packs credit `seed_wallets`)
 * - `handleSowSeed` → in-stream dollar giving sheet
 */
export function useIanCraigLiveSeedActions({
  onOpenGiveSheet,
}: UseIanCraigLiveSeedActionsOptions) {
  const router = useRouter();
  const wallet = useLiveSeedWallet();

  const handleAddSeeds = useCallback(() => {
    const params = new URLSearchParams({ from: EXPERIENCE_LIVE_PATH });
    router.push(`${BUY_SEEDS_PATH}?${params.toString()}`);
  }, [router]);

  const handleSowSeed = useCallback(() => {
    onOpenGiveSheet();
  }, [onOpenGiveSheet]);

  const refreshAfterGive = useCallback(() => {
    void wallet.refresh();
  }, [wallet]);

  return {
    balance: wallet.balance,
    usedFreeTaps: wallet.usedFreeTaps,
    isLoading: wallet.isLoading,
    error: wallet.error,
    refresh: wallet.refresh,
    handleAddSeeds,
    handleSowSeed,
    refreshAfterGive,
  };
}

export type IanCraigLiveSeedActions = ReturnType<typeof useIanCraigLiveSeedActions>;
