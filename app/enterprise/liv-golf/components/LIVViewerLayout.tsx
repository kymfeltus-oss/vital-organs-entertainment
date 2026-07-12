"use client";

import Link from "next/link";
import { useMemo } from "react";
import AttendeeStreamPlayer from "@/components/features/live/AttendeeStreamPlayer";
import LiveStreamGraphicsOverlay from "@/components/features/live/LiveStreamGraphicsOverlay";
import { useLiveStreamGraphics } from "@/lib/features/live/useLiveStreamGraphics";
import { useLiveStreamSubscriber } from "@/lib/live/useLiveStreamSubscriber";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";
import { useLivGeoEligibility } from "@/lib/enterprise/liv-golf/useLivGeoEligibility";
import { useLivStreamStatus } from "@/lib/enterprise/liv-golf/useLivStreamStatus";
import { canMountLivPlayer } from "@/lib/enterprise/liv-golf/check-stream-readiness";
import { LIV_VIEWER_OVERLAY_INSET, LIV_VIEWER_SHELL } from "@/lib/enterprise/liv-golf/responsive";
import { useLivViewerLayout } from "@/lib/enterprise/liv-golf/useLivViewerLayout";
import FanBetPanel from "./FanBetPanel";
import LivGeoComplianceBanner from "./LivGeoComplianceBanner";
import LivStreamStandbyOverlay from "./LivStreamStandbyOverlay";

type LIVViewerLayoutProps = {
  roomId: string;
};

/** Responsive viewer — mobile stack, tablet sidebar, desktop 70/30 split. */
export default function LIVViewerLayout({ roomId }: LIVViewerLayoutProps) {
  const layoutMode = useLivViewerLayout();
  const { status: streamStatus, isLoading: streamStatusLoading } = useLivStreamStatus();
  const playerEnabled = canMountLivPlayer(streamStatus);
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

  const isMobile = layoutMode === "mobile";
  const isDesktopSplit = layoutMode === "desktop-split";
  const showSidePanel = isPanelOpen && !isMobile;

  const streamFlexClass = isDesktopSplit
    ? "flex-[7] min-h-0"
    : layoutMode === "tablet-sidebar"
      ? "flex-[65] min-h-0"
      : "min-h-0 flex-1";

  const panelWidthClass = isDesktopSplit
    ? "w-[30%] max-w-[480px]"
    : "w-[35%] max-w-[420px]";

  const mobilePanelHeight = "h-[min(44dvh,400px)] shrink-0";

  return (
    <div
      className={`${LIV_VIEWER_SHELL} flex bg-[#111111] font-sans text-white antialiased ${
        isMobile ? "flex-col" : "flex-row"
      }`}
    >
      <div
        className={`relative flex min-w-0 items-center justify-center bg-black ${streamFlexClass} ${
          isMobile && isPanelOpen ? "min-h-[56dvh]" : "h-full"
        }`}
      >
        <AttendeeStreamPlayer embedded enabled={playerEnabled} showPaywall={false} />
        <LivStreamStandbyOverlay status={streamStatus} isLoading={streamStatusLoading} />
        {activeGraphic ? <LiveStreamGraphicsOverlay graphic={activeGraphic} /> : null}
      </div>

      {showSidePanel ? (
        <div
          className={`h-full min-w-0 transform border-white/5 bg-[#161616] transition-all duration-300 ease-in-out ${
            layoutMode === "tablet-sidebar" || isDesktopSplit
              ? `border-l ${panelWidthClass} translate-x-0 opacity-100`
              : ""
          }`}
        >
          {showBetPanel ? (
            <div className="h-full w-full min-w-0">
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
      ) : null}

      {isMobile && isPanelOpen ? (
        <div
          className={`w-full min-w-0 border-t border-white/5 bg-[#161616] transition-all duration-300 ease-in-out ${mobilePanelHeight}`}
        >
          {showBetPanel ? (
            <FanBetPanel
              activeBet={activeBet}
              tokenBalance={balance}
              isWalletLoading={isLoading}
              geoAttestationToken={geo.attestationToken}
              geoSample={geo.sample}
              onBetSuccess={refresh}
              compact
            />
          ) : null}

          {showGeoBanner ? (
            <LivGeoComplianceBanner
              compact
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
      ) : null}

      <div
        className={`pointer-events-none absolute z-30 text-[10px] text-white/40 ${LIV_VIEWER_OVERLAY_INSET}`}
      >
        {geo.status === "eligible" ? (
          <Link href="/buy-seeds" className="pointer-events-auto text-[#CCFF00] hover:underline">
            Buy LIV Fan Tokens
          </Link>
        ) : (
          <span className="liv-text-secondary">Token wallet geo-gated</span>
        )}
      </div>
    </div>
  );
}
