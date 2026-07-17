"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { useLivGeoEligibility } from "@/lib/enterprise/liv-golf/useLivGeoEligibility";
import { isShowcaseBetId } from "@/lib/enterprise/liv-golf/legendary-showcase-scenarios";
import { useLiveStreamSubscriber } from "@/lib/live/useLiveStreamSubscriber";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";
import { useWalletStore } from "@/lib/store/useWalletStore";
import FanLiveBettingPanel from "./FanLiveBettingPanel";
import LivGeoComplianceBanner from "./LivGeoComplianceBanner";
import { buildOverlayServerSession, toOverlaySessionRow } from "./micro-betting-overlay/session-utils";
import { VideoOverlayPlayer } from "../live/components/VideoOverlayPlayer";

type LIVViewerLayoutProps = {
  roomId: string;
};

/** Live fan viewer — framed stream with floating micro-betting overlay. */
export default function LIVViewerLayout({ roomId }: LIVViewerLayoutProps) {
  const {
    sessionData,
    activeBet,
    isActive,
    clearOverlays,
    resolvedWinner,
    videoAssetPath,
    refresh: refreshSession,
  } = useLiveStreamSubscriber(roomId);

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

  const { balance, isLoading, refresh } = useLiveSeedWallet({
    enabled: true,
    requestHeaders: walletHeaders,
  });

  const initializeBalance = useWalletStore((state) => state.initializeBalance);
  const setWalletLoading = useWalletStore((state) => state.setWalletLoading);

  useEffect(() => {
    setWalletLoading(isLoading);
  }, [isLoading, setWalletLoading]);

  useEffect(() => {
    if (!isLoading) {
      initializeBalance(balance);
    }
  }, [balance, initializeBalance, isLoading]);

  const serverSession = useMemo(() => {
    if (!sessionData) return null;

    return buildOverlayServerSession({
      session: toOverlaySessionRow(sessionData),
      activeBet: activeBet ?? null,
      isActive,
      clearOverlays,
      resolvedWinner,
    });
  }, [activeBet, clearOverlays, isActive, resolvedWinner, sessionData]);

  const handleWagerSuccess = useCallback(async () => {
    await refresh();
    await refreshSession();
  }, [refresh, refreshSession]);

  const sidebarActiveBet = isPanelOpen && activeBet ? activeBet : null;
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

  const hasShowcaseVideo = Boolean(
    videoAssetPath ||
      (isPanelOpen && activeBet?.bet_id && isShowcaseBetId(activeBet.bet_id)),
  );
  const buySeedsHref = "/buy-seeds?return=%2Fenterprise%2Fliv-golf%2Flive";

  return (
    <div className="min-h-screen bg-black p-6 font-sans text-white antialiased">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <header className="space-y-1 text-center lg:text-left">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#CCFF00]">
            LIV Golf Digital Stream
          </p>
          <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            {hasShowcaseVideo ? "Live Simulation" : "Fan Viewer"}
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 lg:col-span-2">
            <VideoOverlayPlayer
              serverSession={serverSession}
              videoAssetPath={videoAssetPath ?? activeBet?.video_asset_path ?? null}
              className="h-full rounded-2xl border-0"
            >
              {null}
            </VideoOverlayPlayer>
          </div>

          <div className="min-h-[420px] w-full lg:min-h-0">
            <FanLiveBettingPanel
              activeBet={sidebarActiveBet}
              sessionPhase={sessionData?.phase}
              endsAt={sessionData?.endsAt ?? null}
              geoAttestationToken={geo.attestationToken}
              geoSample={geo.sample}
              onBetSuccess={handleWagerSuccess}
              className="h-full min-h-[420px]"
            />
          </div>
        </div>

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

        <footer className="text-center text-[10px] text-white/40 lg:text-left">
          <Link href={buySeedsHref} className="text-[#CCFF00] hover:underline">
            Buy LIV Fan Tokens
          </Link>
        </footer>
      </div>
    </div>
  );
}
