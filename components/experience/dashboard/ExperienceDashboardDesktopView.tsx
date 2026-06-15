"use client";

import ExperienceDashboardBackdrop from "@/components/experience/dashboard/ExperienceDashboardBackdrop";
import ExperienceDashboardContent from "@/components/experience/dashboard/ExperienceDashboardContent";

type ExperienceDashboardDesktopViewProps = {
  displayName: string;
};

export default function ExperienceDashboardDesktopView({
  displayName,
}: ExperienceDashboardDesktopViewProps) {
  return (
    <div className="relative hidden h-[100dvh] min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-brand-black md:block">
      <ExperienceDashboardBackdrop variant="desktop" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-8 pt-2">
        <ExperienceDashboardContent displayName={displayName} variant="desktop" />
      </div>
    </div>
  );
}
