"use client";

import Link from "next/link";
import AttendeeStreamPlayer from "@/components/features/live/AttendeeStreamPlayer";
import LiveStreamGraphicsOverlay from "@/components/features/live/LiveStreamGraphicsOverlay";
import { useLiveStreamGraphics } from "@/lib/features/live/useLiveStreamGraphics";
import { useLiveStreamSubscriber } from "@/lib/live/useLiveStreamSubscriber";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";
import FanBetPanel from "./FanBetPanel";

type LIVViewerLayoutProps = {
  roomId: string;
};

export default function LIVViewerLayout({ roomId }: LIVViewerLayoutProps) {
  const { activeBet } = useLiveStreamSubscriber(roomId);
  const { balance, isLoading, refresh } = useLiveSeedWallet();
  const { activeGraphic } = useLiveStreamGraphics({ enabled: true });

  const isPanelOpen = Boolean(activeBet?.is_active);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111111] font-sans text-white antialiased">
      <div className="relative flex h-full min-w-0 flex-[7] items-center justify-center bg-black">
        <div className="absolute inset-0">
          <AttendeeStreamPlayer embedded={true} enabled showPaywall={false} />
        </div>
        {activeGraphic ? <LiveStreamGraphicsOverlay graphic={activeGraphic} /> : null}
      </div>

      <div
        className={`h-full transform border-l border-white/5 bg-[#161616] transition-all duration-300 ease-in-out ${
          isPanelOpen
            ? "w-[30%] translate-x-0 opacity-100"
            : "pointer-events-none w-0 translate-x-full opacity-0"
        }`}
      >
        {isPanelOpen && activeBet ? (
          <div className="h-full w-full min-w-[320px]">
            <FanBetPanel
              activeBet={activeBet}
              tokenBalance={balance}
              isWalletLoading={isLoading}
              onBetSuccess={refresh}
            />
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-30 text-[10px] text-white/40">
        <Link href="/buy-seeds" className="pointer-events-auto text-[#CCFF00] hover:underline">
          Buy LIV Fan Tokens
        </Link>
      </div>
    </div>
  );
}
