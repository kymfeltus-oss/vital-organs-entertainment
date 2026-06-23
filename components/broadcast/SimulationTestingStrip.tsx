"use client";

import { useCallback, useState } from "react";
import { EyeOff, Loader2, MegaphoneOff, Sparkles } from "lucide-react";
import { scanMessageForTrouble } from "@/lib/ops/chat-scanner";
import { MOCK_CHAT_ALERT_COMPLAINTS } from "@/lib/ops/test-chat-alert-mocks";

type SimulationTestingStripProps = {
  onShowToast?: (message: string) => void;
};

export default function SimulationTestingStrip({ onShowToast }: SimulationTestingStripProps) {
  const [firing, setFiring] = useState(false);

  const triggerFakeChat = useCallback(
    async (index: number) => {
      setFiring(true);
      try {
        const response = await fetch("/api/ops/test-chat-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ index }),
        });

        const data = (await response.json()) as {
          success?: boolean;
          simulatedText?: string;
          detectedIssue?: "audio" | "video" | null;
          error?: string;
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? "Simulator request failed.");
        }

        const preview = data.simulatedText ?? MOCK_CHAT_ALERT_COMPLAINTS[index];
        const detected =
          data.detectedIssue ?? scanMessageForTrouble(preview) ?? "none (control message)";

        onShowToast?.(`Simulated chat sent — scanner: ${detected}`);
      } catch (error) {
        console.error("Failed to fire diagnostic test chat", error);
        onShowToast?.(
          error instanceof Error ? error.message : "Failed to fire diagnostic test chat.",
        );
      } finally {
        setFiring(false);
      }
    },
    [onShowToast],
  );

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="mt-4 border-t border-brand-border pt-4">
      <div className="mb-2 flex items-center gap-1.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-muted">
        <Sparkles className="h-3.5 w-3.5 text-brand-purple" aria-hidden="true" />
        <span>Local Diagnostic Tools</span>
      </div>

      <p className="mb-3 font-body text-[0.72rem] leading-snug text-brand-muted">
        Inserts a mock fellowship chat row and triggers the crew trouble-alert popup on this
        console.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void triggerFakeChat(1)}
          disabled={firing}
          className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-brand-border bg-brand-black/50 p-2.5 font-ui text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-brand-muted transition hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-40"
        >
          {firing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <MegaphoneOff className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>Simulate Audio Complaint</span>
        </button>

        <button
          type="button"
          onClick={() => void triggerFakeChat(2)}
          disabled={firing}
          className="touch-target flex items-center justify-center gap-1.5 rounded-lg border border-brand-border bg-brand-black/50 p-2.5 font-ui text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-brand-muted transition hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-40"
        >
          {firing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>Simulate Video Complaint</span>
        </button>
      </div>
    </div>
  );
}
