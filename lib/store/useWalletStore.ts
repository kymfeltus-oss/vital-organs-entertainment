"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WalletGlowType = "WIN" | "DEDUCT" | null;

export type WalletState = {
  tokenBalance: number;
  isWalletGlowing: boolean;
  glowType: WalletGlowType;
  isWalletLoading: boolean;
  initializeBalance: (amount: number) => void;
  setWalletLoading: (loading: boolean) => void;
  deductTokens: (amount: number) => boolean;
  creditTokens: (amount: number) => void;
  triggerGlow: (type: Exclude<WalletGlowType, null>) => void;
};

let glowTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleGlowClear(clear: () => void, durationMs: number) {
  if (glowTimer) {
    clearTimeout(glowTimer);
  }

  glowTimer = setTimeout(() => {
    clear();
    glowTimer = null;
  }, durationMs);
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      tokenBalance: 2500,
      isWalletGlowing: false,
      glowType: null,
      isWalletLoading: true,

      initializeBalance: (amount) => {
        if (!Number.isFinite(amount) || amount < 0) return;
        set({ tokenBalance: amount });
      },

      setWalletLoading: (loading) => set({ isWalletLoading: loading }),

      deductTokens: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return false;

        const currentBalance = get().tokenBalance;
        if (amount > currentBalance) return false;

        set({
          tokenBalance: currentBalance - amount,
          isWalletGlowing: true,
          glowType: "DEDUCT",
        });

        scheduleGlowClear(() => set({ isWalletGlowing: false, glowType: null }), 1000);
        return true;
      },

      creditTokens: (amount) => {
        if (!Number.isFinite(amount) || amount <= 0) return;

        set({
          tokenBalance: get().tokenBalance + amount,
          isWalletGlowing: true,
          glowType: "WIN",
        });

        scheduleGlowClear(() => set({ isWalletGlowing: false, glowType: null }), 1200);
      },

      triggerGlow: (type) => {
        set({ isWalletGlowing: true, glowType: type });
        scheduleGlowClear(
          () => set({ isWalletGlowing: false, glowType: null }),
          type === "WIN" ? 1200 : 1000,
        );
      },
    }),
    {
      name: "liv-golf-token-wallet",
      partialize: (state) => ({ tokenBalance: state.tokenBalance }),
    },
  ),
);
