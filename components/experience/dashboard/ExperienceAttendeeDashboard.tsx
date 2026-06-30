"use client";

import "@/styles/features/attendee-surfaces.css";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ExperienceDashboardMobileView from "@/components/experience/dashboard/ExperienceDashboardMobileView";
import ProfileEditorModal from "@/components/profile/ProfileEditorModal";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { AWAKENING_PRELOAD_ASSETS } from "@/lib/experience/awakening-dashboard-assets";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceAttendeeDashboardProps = {
  initialProfile: AttendeeProfileSnapshot;
};

function ExperienceAttendeeDashboardInner({
  initialProfile,
}: ExperienceAttendeeDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState(initialProfile);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view !== "profile") return;

    const timer = window.setTimeout(() => {
      setProfileModalOpen(true);
      router.replace(ATTENDEE_DASHBOARD_PATH, { scroll: false });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router, searchParams]);

  useEffect(() => {
    for (const asset of AWAKENING_PRELOAD_ASSETS) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = asset.as;
      link.href = asset.href;
      document.head.appendChild(link);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <>
      <ExperienceDashboardMobileView
        profile={profile}
        onProfileChange={setProfile}
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
