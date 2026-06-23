"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import BottomLiveDashboard from "@/components/live/BottomLiveDashboard";
import FloatingLiveChat from "@/components/live/FloatingLiveChat";
import FloatingReactions from "@/components/live/FloatingReactions";
import LiveActionSheet from "@/components/live/LiveActionSheet";
import LiveChatInput from "@/components/live/LiveChatInput";
import LiveHeader from "@/components/live/LiveHeader";
import LiveVideoBackground from "@/components/live/LiveVideoBackground";
import PrayerModal from "@/components/live/PrayerModal";
import SowSeedModal from "@/components/live/SowSeedModal";
import { useFloatingReactions } from "@/hooks/useFloatingReactions";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useLiveStream } from "@/hooks/useLiveStream";
import { LIVE_STREAM_CLOSE_PATH } from "@/lib/live-stream-routes";

type LiveStreamScreenProps = {
  streamId: string;
};

export default function LiveStreamScreen({ streamId }: LiveStreamScreenProps) {
  const router = useRouter();
  const stream = useLiveStream(streamId);
  const chat = useLiveChat(streamId);
  const reactions = useFloatingReactions();

  const [sowSeedOpen, setSowSeedOpen] = useState(false);
  const [prayerOpen, setPrayerOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const handleClose = useCallback(() => {
    router.push(LIVE_STREAM_CLOSE_PATH);
  }, [router]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `${stream.hostName} — Live`,
          url,
        });
        return;
      }
    } catch {
      // fall through to clipboard
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2_000);
    }
  }, [stream.hostName]);

  const handleCopyLink = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2_000);
    }
    setActionSheetOpen(false);
  }, []);

  return (
    <div className="relative h-dvh min-h-dvh w-screen overflow-hidden bg-brand-black">
      <LiveVideoBackground videoUrl={stream.videoUrl} posterUrl={stream.posterUrl} />

      {/* Gradient overlays z-10 */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-black/45 to-transparent" />
      </div>

      <LiveHeader
        hostName={stream.hostName}
        hostInitials={stream.hostInitials}
        viewerCount={stream.viewerCount}
        onMore={() => setActionSheetOpen(true)}
        onClose={handleClose}
      />

      <FloatingReactions
        reactions={reactions.reactions}
        onSpawn={reactions.spawnHeart}
        onExpire={reactions.removeReaction}
      />

      <FloatingLiveChat messages={chat.messages} />

      <LiveChatInput
        onSend={(text) => {
          chat.sendMessage(text);
        }}
      />

      <BottomLiveDashboard
        streamId={streamId}
        elapsedSeconds={stream.elapsedSeconds}
        seedBalance={stream.seedBalance}
        topSupporter={stream.topSupporter}
        viewerCount={stream.viewerCount}
        onSowSeed={() => setSowSeedOpen(true)}
        onPray={() => setPrayerOpen(true)}
        onShare={() => void handleShare()}
        onMore={() => setActionSheetOpen(true)}
        shareCopied={shareCopied}
      />

      <SowSeedModal open={sowSeedOpen} streamId={streamId} onClose={() => setSowSeedOpen(false)} />

      <PrayerModal
        open={prayerOpen}
        onClose={() => setPrayerOpen(false)}
        onSubmit={() => {
          chat.sendPrayerMessage();
        }}
      />

      <LiveActionSheet
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        onReport={() => setActionSheetOpen(false)}
        onShare={() => {
          setActionSheetOpen(false);
          void handleShare();
        }}
        onCopyLink={() => void handleCopyLink()}
      />
    </div>
  );
}
