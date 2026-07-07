"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExperienceDashboardMobileView from "@/components/experience/dashboard/ExperienceDashboardMobileView";
import ProfileEditorModal from "@/components/profile/ProfileEditorModal";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceAttendeeDashboardProps = {
  initialProfile: AttendeeProfileSnapshot;
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
};

function ExperienceAttendeeDashboardInner({
  initialProfile,
  initialCountdownConfig,
  initialCountdown,
}: ExperienceAttendeeDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState(initialProfile);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view !== "profile" && view !== "settings") return;

    setProfileModalOpen(true);
    router.replace(ATTENDEE_DASHBOARD_PATH, { scroll: false });
  }, [router, searchParams]);

  return (
    <>
      <ExperienceDashboardMobileView
        profile={profile}
        onProfileChange={setProfile}
        initialCountdownConfig={initialCountdownConfig}
        initialCountdown={initialCountdown}
      />

      {profile.userId ? (
        <ProfileEditorModal
          isOpen={profileModalOpen}
          profile={profile}
          onClose={() => setProfileModalOpen(false)}
          onSaved={(nextProfile) => {
            setProfile(nextProfile);
            setProfileModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

export default function ExperienceAttendeeDashboard(props: ExperienceAttendeeDashboardProps) {
  return (
    <Suspense fallback={null}>
      <ExperienceAttendeeDashboardInner {...props} />
    </Suspense>
  );
}
