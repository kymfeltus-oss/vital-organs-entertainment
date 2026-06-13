"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getClientAppUrl } from "@/lib/client-api";
import { parableFetch } from "@/lib/parable/resilient-fetch";
import { useParableSubsystem } from "@/lib/parable/useParableSubsystem";
import {
  acquirePlatformChannel,
  commitPlatformChannelSubscribe,
  releasePlatformChannel,
} from "@/lib/live/platform-channel";
import { getSupabase } from "@/lib/supabase/client";

type UseLiveSeedWalletResult = {
  balance: number;
  usedFreeTaps: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setBalance: (value: number) => void;
  setUsedFreeTaps: (value: number) => void;
};

function reportSeedWalletFailure(
  cancelled: boolean,
  setIsLoading: (value: boolean) => void,
  setError: (value: string | null) => void,
  message: string,
) {
  if (cancelled) return;

  queueMicrotask(() => {
    if (cancelled) return;
    setIsLoading(false);
    setError(message);
  });
}

export function useLiveSeedWallet(): UseLiveSeedWalletResult {
  const seeds = useParableSubsystem("seeds");
  const [balance, setBalance] = useState(0);
  const [usedFreeTaps, setUsedFreeTaps] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localUserIdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!seeds.shouldFetch()) {
      setIsLoading(false);
      setError("Seed wallet paused to protect live stream.");
      return;
    }

    setError(null);

    try {
      const { response } = await parableFetch(
        `${getClientAppUrl()}/api/live/seeds`,
        {
          method: "GET",
          credentials: "include",
        },
        { subsystem: "seeds" },
      );

      const data = (await response.json()) as {
        balance?: number;
        usedFreeTaps?: number;
        error?: string;
      };

      if (response.status === 401) {
        setBalance(0);
        setUsedFreeTaps(0);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Unable to load seed balance.");
        setIsLoading(false);
        return;
      }

      setBalance(typeof data.balance === "number" ? data.balance : 0);
      setUsedFreeTaps(typeof data.usedFreeTaps === "number" ? data.usedFreeTaps : 0);
      setIsLoading(false);
    } catch (refreshError) {
      console.error("Seed wallet refresh failed:", refreshError);
      setError("Unable to load seed balance.");
      setIsLoading(false);
    }
  }, [seeds]);

  useEffect(() => {
    if (!seeds.shouldAllowRealtime()) {
      queueMicrotask(() => {
        void refresh();
      });
      return;
    }

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;

    try {
      supabase = getSupabase();
    } catch (initError) {
      console.error("Seed wallet init failed:", initError);
      reportSeedWalletFailure(
        cancelled,
        setIsLoading,
        setError,
        "Seed wallet is unavailable.",
      );
      return;
    }

    const channel = acquirePlatformChannel(supabase);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "seed_wallets",
      },
      (payload) => {
        if (cancelled) return;

        const row = (payload.new ?? payload.old) as {
          user_id?: string;
          balance?: number;
          used_free_taps?: number;
        };

        if (!localUserIdRef.current || row.user_id !== localUserIdRef.current) {
          return;
        }

        if (typeof row.balance === "number") {
          setBalance(row.balance);
          setIsLoading(false);
        }

        if (typeof row.used_free_taps === "number") {
          setUsedFreeTaps(row.used_free_taps);
        }
      },
    );

    commitPlatformChannelSubscribe();

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) {
        localUserIdRef.current = user?.id ?? null;
      }
    });

    queueMicrotask(() => {
      if (!cancelled) {
        void refresh();
      }
    });

    return () => {
      cancelled = true;
      releasePlatformChannel(supabase);
    };
  }, [refresh, seeds]);

  return {
    balance,
    usedFreeTaps,
    isLoading,
    error,
    refresh,
    setBalance,
    setUsedFreeTaps,
  };
}
