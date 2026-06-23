"use client";

import { useState } from "react";
import { IgLiveChatProvider } from "@/components/experience/live/ig/IgLiveChatContext";
import IanCraigLiveExperience from "@/components/experience/live/pov/ian-craig/IanCraigLiveExperience";
import { LiveStreamReactionsProvider } from "@/lib/experience/LiveStreamReactionsContext";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ViewerPovGoLiveShellProps = {
  initialProfile: AttendeeProfileSnapshot;
  streamEnabled?: boolean;
};

/** Attendee go-live shell — Ian Craig LIVE with wallet, chat, and reactions wired. */
export default function ViewerPovGoLiveShell({
  initialProfile,
  streamEnabled = true,
}: ViewerPovGoLiveShellProps) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <IgLiveChatProvider>
      <LiveStreamReactionsProvider enabled>
        <main className="ian-craig-live-root min-h-dvh w-full bg-brand-black">
          <IanCraigLiveExperience
            profile={profile}
            onProfileChange={setProfile}
            streamEnabled={streamEnabled}
          />
        </main>
      </LiveStreamReactionsProvider>
    </IgLiveChatProvider>
  );
}
