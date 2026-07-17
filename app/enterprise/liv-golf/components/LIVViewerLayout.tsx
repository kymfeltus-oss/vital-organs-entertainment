"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import AttendeeStreamPlayer from "@/components/features/live/AttendeeStreamPlayer";
import LiveStreamGraphicsOverlay from "@/components/features/live/LiveStreamGraphicsOverlay";
import { useLivStreamStatus } from "@/app/enterprise/liv-golf/hooks/useLivStreamStatus";
import { isLivStreamLiveStatus } from "@/lib/enterprise/liv-golf/liv-stream-status-patches";
import { useLivGeoEligibility } from "@/lib/enterprise/liv-golf/useLivGeoEligibility";
import { useLiveStreamGraphics } from "@/lib/features/live/useLiveStreamGraphics";
import { useLiveStreamSubscriber } from "@/lib/live/useLiveStreamSubscriber";
import { useLiveSeedWallet } from "@/lib/useLiveSeedWallet";
import { useWalletStore } from "@/lib/store/useWalletStore";
import FanLiveBettingPanel from "./FanLiveBettingPanel";
import LivGeoComplianceBanner from "./LivGeoComplianceBanner";
import LivStreamStandbyOverlay from "./LivStreamStandbyOverlay";
import { buildOverlayServerSession, toOverlaySessionRow } from "./micro-betting-overlay/session-utils";
import { VideoOverlayPlayer } from "../live/components/VideoOverlayPlayer";

type LIVViewerLayoutProps = {
  roomId: string;
};

/** Live fan viewer — framed stream with floating micro-betting overlay. */
export default function LIVViewerLayout({ roomId }: LIVViewerLayoutProps) {
  const {
    status: streamStatus,
    isLoading: streamStatusLoading,
    isStateSyncing,
    isPlayerLive,
    error: streamStatusError,
  } = useLivStreamStatus({ mountPlayerDuringStateSync: true });

  const {
    sessionData,
    activeBet,
    isActive,
    clearOverlays,
    resolvedWinner,
    videoAssetPath,
    refresh: refreshSession,
  } = useLiveStreamSubscriber(roomId);

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

  const isLive = streamStatus?.isLive === true || isLivStreamLiveStatus(streamStatus);
  const buySeedsHref = "/buy-seeds?return=%2Fenterprise%2Fliv-golf%2Flive";

  const liveStreamSlot = (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(204,255,0,0.06),transparent_45%)]" />
      <div className="absolute inset-0">
        <AttendeeStreamPlayer embedded enabled={isPlayerLive} showPaywall={false} />
      </div>
      <LivStreamStandbyOverlay
        status={streamStatus}
        isLoading={streamStatusLoading}
        isStateSyncing={isStateSyncing}
        syncError={streamStatusError}
      />
      {activeGraphic ? <LiveStreamGraphicsOverlay graphic={activeGraphic} /> : null}
      {!isPlayerLive && !streamStatusLoading ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <span className="mb-1 block text-xs font-bold uppercase tracking-widest text-neutral-500">
              LIV Golf Digital Stream Feed
            </span>
            <h2 className="text-2xl font-black tracking-tight text-[#CCFF00]">
              {isLive ? "Live Broadcast" : "Awaiting Stream"}
            </h2>
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2">
        {isLive ? (
          <>
            <span className="liv-live-dot h-2 w-2 rounded-full bg-red-500" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white">
              Live Feed
            </span>
          </>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black p-6 font-sans text-white antialiased">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <header className="space-y-1 text-center lg:text-left">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#CCFF00]">
            LIV Golf Digital Stream
          </p>
          <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            {isLive ? "Live Broadcast" : "Fan Viewer"}
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 lg:col-span-2">
            <VideoOverlayPlayer
              serverSession={serverSession}
              videoAssetPath={videoAssetPath ?? activeBet?.video_asset_path ?? null}
              liveStream={liveStreamSlot}
              className="h-full rounded-2xl border-0"
            >
              {null}
            </VideoOverlayPlayer>
          </div>

          <div className="min-h-[420px] w-full lg:min-h-0">
            <FanLiveBettingPanel
              activeBet={sidebarActiveBet}
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
