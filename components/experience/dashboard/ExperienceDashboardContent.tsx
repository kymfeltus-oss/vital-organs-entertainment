"use client";

import ExperienceDashboardInterfaceLayer from "@/components/experience/dashboard/ExperienceDashboardInterfaceLayer";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type ExperienceDashboardContentProps = {
  profile: AttendeeProfileSnapshot;
};

export default function ExperienceDashboardContent({
  profile,
}: ExperienceDashboardContentProps) {
  return <ExperienceDashboardInterfaceLayer profile={profile} />;
}
