"use client";

import { useState } from "react";
import { useLiveChatStore } from "@/lib/liveChatStore";

type ModeratorChatActionsProps = {
  messageId: string;
  username: string;
  messageBody: string;
};

export default function ModeratorChatActions({
  messageId,
  username,
  messageBody,
}: ModeratorChatActionsProps) {
  const deleteMessage = useLiveChatStore((state) => state.deleteChatMessagePermanently);
  const moderationError = useLiveChatStore((state) => state.error);
  const clearError = useLiveChatStore((state) => state.clearError);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleRequestDrop = () => {
    clearError();
    setIsConfirming(true);
  };

  const handleCancel = () => {
    setIsConfirming(false);
    clearError();
  };

  const handleConfirmDrop = async () => {
    setIsProcessing(true);
    clearError();

    try {
      await deleteMessage(messageId);
      setIsConfirming(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-2 rounded-md border border-zinc-800 bg-zinc-950/90 p-2 font-mono text-xs text-zinc-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate">
            <span className="font-bold text-amber-400">@{username}</span>{" "}
            <span className="text-zinc-300">{messageBody}</span>
          </p>
          {moderationError ? (
            <p className="mt-1 text-[0.68rem] text-red-300" data-testid={`moderation-error-${messageId}`}>
              {moderationError}
            </p>
          ) : null}
        </div>

        {!isConfirming ? (
          <button
            type="button"
            data-testid={`request-drop-chat-message-${messageId}`}
            onClick={handleRequestDrop}
            disabled={isProcessing}
            className="rounded border border-red-700 bg-red-950 px-2 py-1 font-bold text-red-200 transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Drop Message
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              data-testid={`confirm-drop-chat-message-${messageId}`}
              onClick={() => void handleConfirmDrop()}
              disabled={isProcessing}
              className="rounded border border-red-500 bg-red-900 px-2 py-1 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? "Dropping" : "Confirm"}
            </button>
            <button
              type="button"
              data-testid={`cancel-drop-chat-message-${messageId}`}
              onClick={handleCancel}
              disabled={isProcessing}
              className="rounded border border-zinc-600 bg-zinc-900 px-2 py-1 font-bold text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
