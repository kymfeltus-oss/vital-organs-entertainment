"use client";

import ExperienceDashboardBackdrop from "@/components/experience/dashboard/ExperienceDashboardBackdrop";
import ExperienceDashboardContent from "@/components/experience/dashboard/ExperienceDashboardContent";

type ExperienceDashboardMobileViewProps = {
  displayName: string;
};

export default function ExperienceDashboardMobileView({
  displayName,
}: ExperienceDashboardMobileViewProps) {
  return (
    <div className="relative flex h-dvh min-h-dvh w-full max-w-[100vw] flex-col overflow-hidden bg-brand-black md:hidden">
      <ExperienceDashboardBackdrop variant="mobile" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto pb-safe">
        <ExperienceDashboardContent displayName={displayName} variant="mobile" />
      </div>
    </div>
  );
}
