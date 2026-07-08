"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Disc3, FolderOpen, Home, Play } from "lucide-react";
import { useCallback, useState } from "react";

import GlassButton from "@/app/enterprise/coleman/components/home/ui/GlassButton";
import { useColemanAudio } from "@/app/enterprise/coleman/components/ColemanAudioProvider";
import {
  ColemanApiError,
  fetchSetlist,
  recordPlayback,
} from "@/app/enterprise/coleman/lib/api-client";
import { COLEMAN_API, COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

type BottomNavProps = {
  onPlaybackError?: (message: string) => void;
};

const TABS = [
  { href: COLEMAN_ROUTES.home, label: "HOME", Icon: Home },
  { href: COLEMAN_ROUTES.explore, label: "EXPLORE", Icon: Compass },
  { href: COLEMAN_ROUTES.studio, label: "STUDIO", Icon: Disc3 },
  { href: COLEMAN_ROUTES.library, label: "LIBRARY", Icon: FolderOpen },
] as const;

export default function BottomNav({ onPlaybackError }: BottomNavProps) {
  const pathname = usePathname();
  const { currentlyPlayingTrackId, toggleTrack, stopAll } = useColemanAudio();
  const [playBusy, setPlayBusy] = useState(false);
  const isPlaying = Boolean(currentlyPlayingTrackId);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      stopAll();
      return;
    }
    try {
      setPlayBusy(true);
      const setlist = await fetchSetlist();
      const playable = setlist.find((track) => track.audioFiles.length > 0);
      if (!playable) {
        onPlaybackError?.("Upload a loop or stem before playing.");
        return;
      }
      await toggleTrack(playable.id, COLEMAN_API.audioStream(playable.audioFiles[0]));
      await recordPlayback(playable.id);
    } catch (error) {
      onPlaybackError?.(
        error instanceof ColemanApiError ? error.message : "Could not start playback.",
      );
    } finally {
      setPlayBusy(false);
    }
  }, [isPlaying, onPlaybackError, stopAll, toggleTrack]);

  return (
    <nav
      className="coleman-nav-dock absolute inset-x-2.5 bottom-1.5 z-30 rounded-[26px] px-1.5 pb-[max(6px,env(safe-area-inset-bottom))] pt-2"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5 items-end">
        {TABS.slice(0, 2).map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 pb-0.5"
            >
              <Icon
                size={18}
                strokeWidth={1.25}
                className={active ? "text-[var(--cp-champagne)]" : "text-[var(--cp-muted)]"}
              />
              <span
                className={`text-[7px] font-normal tracking-[0.16em] ${
                  active ? "text-[var(--cp-champagne)]" : "text-[var(--cp-muted)]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <div className="-mt-8 flex justify-center">
          <GlassButton
            size="lg"
            onClick={() => void handlePlay()}
            disabled={playBusy}
            className="coleman-nav-play !h-[64px] !w-[64px]"
            aria-label={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? (
              <span className="h-3 w-3 rounded-sm bg-[var(--cp-bronze)]" />
            ) : (
              <Play
                size={22}
                strokeWidth={1.5}
                className="ml-0.5 text-[var(--cp-bronze)]"
                fill="var(--cp-bronze)"
              />
            )}
          </GlassButton>
        </div>

        {TABS.slice(2).map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-0.5 pb-0.5"
            >
              <Icon
                size={18}
                strokeWidth={1.25}
                className={active ? "text-[var(--cp-champagne)]" : "text-[var(--cp-muted)]"}
              />
              <span
                className={`text-[7px] font-normal tracking-[0.16em] ${
                  active ? "text-[var(--cp-champagne)]" : "text-[var(--cp-muted)]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
