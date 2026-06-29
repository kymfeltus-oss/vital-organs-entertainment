"use client";

import { useState } from "react";
import { useLiveChatStore } from "@/lib/liveChatStore";

type LiveReactionsTrayProps = {
  userId: string;
  eventId?: string;
};

type ReactionOption = {
  type: "HEART" | "FIRE" | "APPLAUSE" | "LAUGH" | "SURPRISE";
  label: string;
  colorClass: string;
};

const REACTION_PRESETS: ReactionOption[] = [
  { type: "HEART", label: "❤️", colorClass: "hover:bg-red-950 border-red-800" },
  { type: "FIRE", label: "🔥", colorClass: "hover:bg-orange-950 border-orange-800" },
  { type: "APPLAUSE", label: "👏", colorClass: "hover:bg-yellow-950 border-yellow-800" },
  { type: "LAUGH", label: "😂", colorClass: "hover:bg-blue-950 border-blue-800" },
  { type: "SURPRISE", label: "😮", colorClass: "hover:bg-purple-950 border-purple-800" },
];

export default function LiveReactionsTray({
  userId,
  eventId = "300-awakening",
}: LiveReactionsTrayProps) {
  const emitReaction = useLiveChatStore((state) => state.emitLiveStreamReaction);
  const [activePayload, setActivePayload] = useState<ReactionOption["type"] | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const handleEmitReaction = async (type: ReactionOption["type"]) => {
    if (!userId.trim()) {
      setErrorFeedback("Authenticated client session is required.");
      return;
    }

    setActivePayload(type);
    setErrorFeedback(null);

    try {
      await emitReaction(type, userId, eventId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send reaction.";
      setErrorFeedback(message);
    } finally {
      window.setTimeout(() => {
        setActivePayload(null);
      }, 300);
    }
  };

  return (
    <div className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
          Real-Time Telemetry Reaction Deck
        </h4>
        {errorFeedback ? (
          <span
            className="rounded border border-red-900 bg-red-950/50 px-2 py-0.5 text-[10px] font-bold text-red-400"
            data-testid="live-reactions-error"
          >
            {errorFeedback}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {REACTION_PRESETS.map((preset) => {
          const isPending = activePayload === preset.type;
          return (
            <button
              key={preset.type}
              type="button"
              data-testid={`emit-reaction-${preset.type.toLowerCase()}`}
              disabled={activePayload !== null}
              onClick={() => void handleEmitReaction(preset.type)}
              className={`flex aspect-square flex-1 transform flex-col items-center justify-center rounded-md border bg-zinc-900 p-2 text-xl transition-all duration-150 ${
                isPending
                  ? "scale-90 border-zinc-600 bg-zinc-800"
                  : `${preset.colorClass} border-zinc-800 active:scale-95`
              } disabled:cursor-not-allowed disabled:opacity-60`}
              title={`Emit ${preset.type} telemetry event signal`}
            >
              <span className={isPending ? "animate-bounce" : ""}>{preset.label}</span>
              <span className="mt-1 block text-[9px] font-bold tracking-tighter text-zinc-500">
                {preset.type.slice(0, 4)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
