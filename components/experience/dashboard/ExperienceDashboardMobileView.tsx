"use client";

import ExperienceDashboardBackdrop from "@/components/experience/dashboard/ExperienceDashboardBackdrop";
import ExperienceDashboardNav from "@/components/experience/dashboard/ExperienceDashboardNav";
import AwakeningHeader from "@/components/experience/dashboard/AwakeningHeader";

type ExperienceDashboardMobileViewProps = {
  displayName: string;
};

export default function ExperienceDashboardMobileView({
  displayName,
}: ExperienceDashboardMobileViewProps) {
  return (
    <div className="relative flex min-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-hidden bg-brand-black md:hidden">
      <ExperienceDashboardBackdrop variant="mobile" />

      <div className="relative z-10 shrink-0 pt-[max(0.1rem,env(safe-area-inset-top))]">
        <AwakeningHeader displayName={displayName} />
      </div>

      <ExperienceDashboardNav variant="bottom" />
    </div>
  );
}
