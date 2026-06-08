"use client";

import dynamic from "next/dynamic";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import StreamPaywallOverlay from "@/components/live/StreamPaywallOverlay";
import LightweightLiveLoading from "@/components/live/LightweightLiveLoading";
import type { LiveEmote } from "@/lib/live/emotes";
import {
  useLiveEmoteFanout,
  type FloatingEmote,
} from "@/lib/useLiveEmoteFanout";
import { useLiveRoomChat } from "@/lib/useLiveRoomChat";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";
import { useLiveStreamState } from "@/lib/useLiveStreamState";

const HardenedPlayerContainer = dynamic(
  () => import("@/components/live/HardenedPlayerContainer"),
  { ssr: false, loading: () => <LightweightLiveLoading /> },
);

const LiveInteractionDock = dynamic(
  () => import("@/components/live/LiveInteractionDock"),
  { ssr: false },
);

const AwakeningHarvestTracker = dynamic(
  () => import("@/components/live/AwakeningHarvestTracker"),
  { ssr: false },
);

const SeedPackUpsellModal = dynamic(
  () => import("@/components/live/SeedPackUpsellModal"),
  { ssr: false },
);

type LivePlatformGridClientProps = {
  showStreamPaywall: boolean;
  isActivatingPass: boolean;
  userEmail: string | null;
  userId: string | null;
};

export default function LivePlatformGridClient({
  showStreamPaywall,
  isActivatingPass,
  userEmail,
  userId,
}: LivePlatformGridClientProps) {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [chatDraft, setChatDraft] = useState("");
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [localEmotes, setLocalEmotes] = useState<FloatingEmote[]>([]);

  const {
    isLive: streamIsLive,
    isLoading: isStreamStateLoading,
    error: streamStateError,
  } = useLiveStreamState();
  const {
    balance: seedBalance,
    usedFreeTaps,
    isLoading: isSeedBalanceLoading,
    error: seedBalanceError,
    refresh: refreshSeedBalance,
    setBalance: setSeedBalance,
    setUsedFreeTaps,
  } = useLiveSeedWallet();
  const { floatingEmotes, dismissEmote } = useLiveEmoteFanout();
  const {
    messages: chatMessages,
    isLoading: isChatLoading,
    isSending: isChatSending,
    error: chatError,
    sendMessage,
  } = useLiveRoomChat();

  const pushLocalEmote = useCallback((emote: LiveEmote, originX: number) => {
    const key = `local-${emote.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setLocalEmotes((current) => [
      ...current.slice(-24),
      {
        emoteId: emote.id,
        emoji: emote.emoji,
        author: "You",
        originX,
        key,
      },
    ]);
  }, []);

  const dismissLocalEmote = useCallback((key: string) => {
    setLocalEmotes((current) => current.filter((emote) => emote.key !== key));
  }, []);

  const combinedEmotes = useMemo(
    () => [...localEmotes, ...floatingEmotes],
    [localEmotes, floatingEmotes],
  );

  const handleDismissEmote = useCallback(
    (key: string) => {
      if (key.startsWith("local-")) {
        dismissLocalEmote(key);
        return;
      }

      dismissEmote(key);
    },
    [dismissEmote, dismissLocalEmote],
  );

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("seeds") === "success") {
      void refreshSeedBalance();
      window.history.replaceState({}, "", "/dashboard/live");
    }
  }, [refreshSeedBalance]);

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = chatDraft.trim();
    if (!trimmed || isChatSending) return;

    void sendMessage(trimmed).then((sent) => {
      if (sent) {
        setChatDraft("");
      }
    });
  };

  return (
    <main className="flex min-h-dvh w-full flex-col bg-[#0B090A] pt-safe pb-safe text-white">
      <header className="shrink-0 border-b border-white/10 px-4 py-3 md:px-6">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-[#1E40AF]">
          Live Interaction Hub
        </p>
        <h1 className="mt-1 text-base font-bold uppercase tracking-widest text-white">
          300 Awakening Live
        </h1>
      </header>

      <div className="grid h-full w-full flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-12 md:p-6">
        <section className="flex min-h-[50dvh] flex-col md:col-span-6 md:min-h-0">
          <HardenedPlayerContainer
            showStreamPaywall={showStreamPaywall && !isActivatingPass}
            isPassActivating={isActivatingPass}
            streamIsLive={streamIsLive}
            isStreamStateLoading={isStreamStateLoading}
            streamStateError={streamStateError}
            userEmail={userEmail}
            userId={userId}
            floatingEmotes={combinedEmotes}
            onDismissEmote={handleDismissEmote}
            paywallOverlay={
              showStreamPaywall && !isActivatingPass ? (
                <StreamPaywallOverlay />
              ) : undefined
            }
          />

          <LiveInteractionDock
            balance={seedBalance}
            usedFreeTaps={usedFreeTaps}
            isBalanceLoading={isSeedBalanceLoading}
            balanceError={seedBalanceError}
            onBalanceChange={setSeedBalance}
            onFreeTapsUsedChange={setUsedFreeTaps}
            onLocalEmote={pushLocalEmote}
            onUpsellOpen={() => setIsUpsellOpen(true)}
          />
        </section>

        <aside className="flex flex-col md:col-span-3">
          <AwakeningHarvestTracker />
        </aside>

        <aside className="flex min-h-[320px] flex-col md:col-span-3 md:min-h-[480px]">
          <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#111111]/80 p-4">
            <p className="shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.22em] text-zinc-300">
              Interaction Stream
            </p>

            <div
              ref={chatScrollRef}
              className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1"
              aria-label="Live room chat messages"
            >
              {isChatLoading && (
                <p className="text-xs text-zinc-500">Loading live room chat...</p>
              )}
              {chatError && <p className="text-xs text-zinc-400">{chatError}</p>}
              <AnimatePresence initial={false}>
                {chatMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-white/10 bg-[#0B090A]/80 px-3 py-2"
                  >
                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#1E40AF]">
                      {message.author}
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{message.body}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <form onSubmit={handleChatSubmit} className="mt-4 shrink-0">
              <input
                type="text"
                value={chatDraft}
                onChange={(event) => setChatDraft(event.target.value)}
                placeholder="Send love to the choir..."
                disabled={isChatSending}
                className="w-full rounded-full border border-white/15 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#1E40AF] focus:ring-1 focus:ring-[#1E40AF] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </form>
          </section>
        </aside>
      </div>

      <SeedPackUpsellModal
        isOpen={isUpsellOpen}
        onClose={() => setIsUpsellOpen(false)}
      />
    </main>
  );
}
