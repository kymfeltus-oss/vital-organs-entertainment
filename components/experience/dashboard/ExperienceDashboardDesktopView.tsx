"use client";

import ExperienceDashboardBackdrop from "@/components/experience/dashboard/ExperienceDashboardBackdrop";
import AwakeningHeader from "@/components/experience/dashboard/AwakeningHeader";

type ExperienceDashboardDesktopViewProps = {
  displayName: string;
};

export default function ExperienceDashboardDesktopView({
  displayName,
}: ExperienceDashboardDesktopViewProps) {
  return (
    <div className="relative hidden h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-brand-black md:block">
      <ExperienceDashboardBackdrop variant="desktop" />

      <div className="relative z-10 shrink-0 pt-2">
        <AwakeningHeader displayName={displayName} />
      </div>
    </div>
  );
}
