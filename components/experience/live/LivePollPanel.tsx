"use client";

import { useLivePoll } from "@/lib/experience/useLivePoll";

export default function LivePollPanel() {
  const {
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
    clearError,
  } = useLivePoll();

  if (isLoading || !poll) {
    return null;
  }

  const hasVoted = userVote !== null;
  const showResults = hasVoted;

  return (
    <section
      className="experience-live-poll-panel experience-glass-panel my-1 w-full shrink-0 rounded-xl border border-white/5 bg-[#111111]/60 p-3 md:my-0 md:p-4"
      aria-live="polite"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <div className="h-3.5 w-1 rounded-full bg-[#1E40AF]" aria-hidden="true" />
        <h2 className="font-ui text-[0.6rem] font-bold uppercase tracking-[0.16em] text-zinc-400">
          Audience Pulse Vote
        </h2>
      </div>

      <p className="mb-3 font-body text-xs font-semibold leading-relaxed text-white">
        {poll.question}
      </p>

      {error ? (
        <p className="mb-2 font-body text-xs text-[#B0267A]" role="alert">
          {error}
          <button
            type="button"
            onClick={clearError}
            className="ml-2 underline decoration-white/30"
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <div className="mb-3 space-y-2">
        <button
          type="button"
          disabled={!session.canVote || isSubmitting}
          onClick={() => void submitVote("A")}
          className={`touch-target flex w-full items-center justify-between rounded-lg border p-3 text-left font-ui text-xs transition ${
            userVote === "A"
              ? "border-[#1E40AF] bg-[#1E40AF]/10 text-white"
              : "border-white/5 bg-black/40 text-zinc-300 hover:border-white/10 hover:text-white"
          } disabled:opacity-85`}
        >
          <span>{poll.optionA}</span>
          {showResults ? (
            <span className="font-body font-bold text-[#1E40AF]">{percentA}%</span>
          ) : null}
        </button>

        <button
          type="button"
          disabled={!session.canVote || isSubmitting}
          onClick={() => void submitVote("B")}
          className={`touch-target flex w-full items-center justify-between rounded-lg border p-3 text-left font-ui text-xs transition ${
            userVote === "B"
              ? "border-[#B0267A] bg-[#B0267A]/10 text-white"
              : "border-white/5 bg-black/40 text-zinc-300 hover:border-white/10 hover:text-white"
          } disabled:opacity-85`}
        >
          <span>{poll.optionB}</span>
          {showResults ? (
            <span className="font-body font-bold text-[#B0267A]">{percentB}%</span>
          ) : null}
        </button>
      </div>

      {!session.authenticated ? (
        <p className="font-body text-[0.7rem] text-zinc-400">
          Sign in to cast your vote.
        </p>
      ) : null}

      {showResults ? (
        <div className="space-y-2.5 border-t border-white/5 pt-3 font-ui text-[0.6rem] text-zinc-400">
          <div>
            <div className="mb-1 flex justify-between">
              <span>{poll.optionA}</span>
              <span className="font-body text-white">{totals.countA} votes</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full bg-[#1E40AF] transition-[width] duration-500 ease-out"
                style={{ width: `${percentA}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between">
              <span>{poll.optionB}</span>
              <span className="font-body text-white">{totals.countB} votes</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full bg-[#B0267A] transition-[width] duration-500 ease-out"
                style={{ width: `${percentB}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
