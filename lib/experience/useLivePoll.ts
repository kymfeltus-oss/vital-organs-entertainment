"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  computePollPercentages,
  isLivePollChoice,
  type LivePollChoice,
  type LivePollPayload,
} from "@/lib/experience/polls";
import {
  buildChannelName,
  createRealtimeChannel,
  teardownRealtimeChannel,
} from "@/lib/live/realtime-subscribe";
import { getClientAppUrl } from "@/lib/client-api";
import { parableFetch } from "@/lib/parable/resilient-fetch";
import { useParableSubsystem } from "@/lib/parable/useParableSubsystem";
import { getSupabase } from "@/lib/supabase/client";

const LIVE_POLL_CHANNEL = "live-audience-poll";
const POLL_FALLBACK_MS = 20_000;

type UseLivePollResult = {
  poll: LivePollPayload["poll"];
  totals: LivePollPayload["totals"];
  userVote: LivePollChoice | null;
  session: LivePollPayload["session"];
  percentA: number;
  percentB: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  submitVote: (choice: LivePollChoice) => Promise<boolean>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const EMPTY_TOTALS = { countA: 0, countB: 0 };

export function useLivePoll(): UseLivePollResult {
  const polls = useParableSubsystem("polls");
  const instanceId = useId().replace(/:/g, "");
  const channelRef = useRef<Awaited<ReturnType<typeof createRealtimeChannel>> | null>(null);
  const activePollIdRef = useRef<string | null>(null);

  const [poll, setPoll] = useState<LivePollPayload["poll"]>(null);
  const [totals, setTotals] = useState(EMPTY_TOTALS);
  const [userVote, setUserVote] = useState<LivePollChoice | null>(null);
  const [session, setSession] = useState<LivePollPayload["session"]>({
    authenticated: false,
    canVote: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePollingFallback, setUsePollingFallback] = useState(false);

  const syncPoll = useCallback(async () => {
    if (!polls.shouldFetch()) {
      setIsLoading(false);
      setError("Polls paused to protect live stream.");
      return;
    }

    try {
      const { response, latencyMs } = await parableFetch(
        `${getClientAppUrl()}/api/experience/polls`,
        {
          cache: "no-store",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("poll feed unavailable");
      }

      const payload = (await response.json()) as LivePollPayload;
      activePollIdRef.current = payload.poll?.id ?? null;
      setPoll(payload.poll);
      setTotals(payload.totals);
      setUserVote(payload.userVote);
      setSession(payload.session);
      setUsePollingFallback(false);
      setError(null);
      polls.reportSuccess(latencyMs);
    } catch (syncError) {
      console.error("Live poll sync failed:", syncError);
      polls.reportFailure();
      setUsePollingFallback(false);
    } finally {
      setIsLoading(false);
    }
  }, [polls]);

  useEffect(() => {
    void syncPoll();
  }, [syncPoll]);

  useEffect(() => {
    if (!usePollingFallback || polls.isIsolated || polls.safeMode) return;
    const intervalId = window.setInterval(() => {
      void syncPoll();
    }, POLL_FALLBACK_MS);
    return () => window.clearInterval(intervalId);
  }, [polls.isIsolated, polls.safeMode, syncPoll, usePollingFallback]);

  useEffect(() => {
    if (!polls.shouldAllowRealtime()) {
      setUsePollingFallback(true);
      return;
    }

    let cancelled = false;
    let supabase: ReturnType<typeof getSupabase>;
    let setupPromise: Promise<void> = Promise.resolve();

    try {
      supabase = getSupabase();
    } catch (initError) {
      console.error("Live poll realtime init failed:", initError);
      setUsePollingFallback(true);
      return;
    }

    const channelName = buildChannelName(LIVE_POLL_CHANNEL, instanceId);

    setupPromise = (async () => {
      try {
        const channel = await createRealtimeChannel(supabase, channelName, {
          postgres: [
            {
              event: "INSERT",
              schema: "public",
              table: "live_poll_votes",
              callback: () => {
                void syncPoll();
              },
            },
            {
              event: "UPDATE",
              schema: "public",
              table: "live_polls",
              callback: (payload) => {
                const nextActive = payload.new.is_active === true;
                if (!nextActive && activePollIdRef.current === payload.new.id) {
                  activePollIdRef.current = null;
                  setPoll(null);
                }
                void syncPoll();
              },
            },
            {
              event: "INSERT",
              schema: "public",
              table: "live_polls",
              callback: () => {
                void syncPoll();
              },
            },
          ],
        });

        if (cancelled) {
          await teardownRealtimeChannel(supabase, channel);
          return;
        }

        channelRef.current = channel;
      } catch (subscribeError) {
        console.error("Live poll subscribe failed:", subscribeError);
        if (!cancelled) setUsePollingFallback(true);
      }
    })();

    return () => {
      cancelled = true;
      void (async () => {
        await setupPromise;
        const channel = channelRef.current;
        channelRef.current = null;
        await teardownRealtimeChannel(supabase, channel);
      })();
    };
  }, [polls, instanceId, syncPoll]);

  const submitVote = useCallback(
    async (choice: LivePollChoice): Promise<boolean> => {
      if (!poll || !session.canVote || isSubmitting) return false;
      if (!isLivePollChoice(choice)) return false;

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${getClientAppUrl()}/api/experience/polls/vote`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pollId: poll.id, choice }),
        });

        const payload = (await response.json()) as {
          error?: string;
          totals?: LivePollPayload["totals"];
          userVote?: LivePollChoice;
        };

        if (!response.ok) {
          setError(payload.error ?? "Unable to record vote.");
          return false;
        }

        if (payload.totals) setTotals(payload.totals);
        setUserVote(payload.userVote ?? choice);
        setSession((current) => ({ ...current, canVote: false }));
        return true;
      } catch (voteError) {
        console.error("Live poll vote failed:", voteError);
        setError("Unable to record vote.");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, poll, session.canVote],
  );

  const { percentA, percentB } = computePollPercentages(totals);

  return {
    poll,
    totals,
    userVote,
    session,
    percentA,
    percentB,
    isLoading,
    isSubmitting,
    error,
    submitVote,
    refresh: syncPoll,
    clearError: () => setError(null),
  };
}
