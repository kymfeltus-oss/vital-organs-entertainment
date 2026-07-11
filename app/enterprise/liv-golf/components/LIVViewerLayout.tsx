"use client";

import Link from "next/link";
import { useMemo } from "react";
import AttendeeStreamPlayer from "@/components/features/live/AttendeeStreamPlayer";
import LiveStreamGraphicsOverlay from "@/components/features/live/LiveStreamGraphicsOverlay";
import { useLiveStreamGraphics } from "@/lib/features/live/useLiveStreamGraphics";
import { useLiveStreamSubscriber } from "@/lib/live/useLiveStreamSubscriber";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";
import { useLivGeoEligibility } from "@/lib/enterprise/liv-golf/useLivGeoEligibility";
import FanBetPanel from "./FanBetPanel";
import LivGeoComplianceBanner from "./LivGeoComplianceBanner";

type LIVViewerLayoutProps = {
  roomId: string;
};

/** 70/30 viewport splitter — live broadcast canvas + geo-gated micro-bet drawer. */
export default function LIVViewerLayout({ roomId }: LIVViewerLayoutProps) {
  const { activeBet } = useLiveStreamSubscriber(roomId);
  const { activeGraphic } = useLiveStreamGraphics({ enabled: true });

  const isPanelOpen = Boolean(activeBet?.is_active);
  const geo = useLivGeoEligibility({ enabled: isPanelOpen });

  const walletHeaders = useMemo(() => {
    const headers: Record<string, string> = { "x-liv-golf-context": "enterprise" };
    if (geo.sample) {
      headers["x-liv-geo-lat"] = String(geo.sample.lat);
      headers["x-liv-geo-lng"] = String(geo.sample.lng);
    }
    if (geo.attestationToken) {
      headers["x-liv-geo-attestation"] = geo.attestationToken;
    }
    return headers;
  }, [geo.attestationToken, geo.sample]);

  const walletEnabled = !isPanelOpen || geo.status === "eligible";
  const { balance, isLoading, refresh } = useLiveSeedWallet({
    enabled: walletEnabled,
    requestHeaders: walletHeaders,
  });

  const showBetPanel = isPanelOpen && geo.status === "eligible" && activeBet;
  const showGeoBanner =
    isPanelOpen &&
    (geo.status === "locating" ||
      geo.status === "checking" ||
      geo.status === "ineligible" ||
      geo.status === "unavailable" ||
      geo.status === "unsupported");

  const geoBannerMessage =
    geo.error ??
    geo.result?.reason ??
    (geo.status === "locating" || geo.status === "checking"
      ? "Confirming your coordinates against the active tournament corridor..."
      : "Prop wagering is not available in your region.");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111111] font-sans text-white antialiased">
      <div className="relative flex h-full min-w-0 flex-[7] items-center justify-center bg-black">
        <AttendeeStreamPlayer embedded enabled showPaywall={false} />
        {activeGraphic ? <LiveStreamGraphicsOverlay graphic={activeGraphic} /> : null}
      </div>

      <div
        className={`h-full transform border-l border-white/5 bg-[#161616] transition-all duration-300 ease-in-out ${
          isPanelOpen
            ? "w-[30%] translate-x-0 opacity-100"
            : "pointer-events-none w-0 translate-x-full opacity-0"
        }`}
      >
        {showBetPanel ? (
          <div className="h-full w-full min-w-[320px]">
            <FanBetPanel
              activeBet={activeBet}
              tokenBalance={balance}
              isWalletLoading={isLoading}
              geoAttestationToken={geo.attestationToken}
              geoSample={geo.sample}
              onBetSuccess={refresh}
            />
          </div>
        ) : null}

        {showGeoBanner ? (
          <LivGeoComplianceBanner
            status={
              geo.status === "locating" || geo.status === "checking"
                ? geo.status
                : geo.status === "unsupported"
                  ? "unsupported"
                  : geo.status === "unavailable"
                    ? "unavailable"
                    : "ineligible"
            }
            message={geoBannerMessage}
            onRetry={() => void geo.refresh()}
          />
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-30 text-[10px] text-white/40">
        {geo.status === "eligible" ? (
          <Link href="/buy-seeds" className="pointer-events-auto text-[#CCFF00] hover:underline">
            Buy LIV Fan Tokens
          </Link>
        ) : (
          <span className="text-zinc-500">Token wallet geo-gated</span>
        )}
      </div>
    </div>
  );
}
