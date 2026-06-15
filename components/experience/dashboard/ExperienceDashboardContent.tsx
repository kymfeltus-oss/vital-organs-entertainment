"use client";

import AwakeningHeroCTA from "@/components/AwakeningHeroCTA";
import AwakeningMenuButton from "@/components/AwakeningMenuButton";
import ProfileOrb from "@/components/ProfileOrb";
import AwakeningHeader from "@/components/experience/dashboard/AwakeningHeader";

type ExperienceDashboardContentProps = {
  displayName: string;
  variant?: "mobile" | "desktop";
};

function profileOrbInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return "G";
  return trimmed.slice(0, 2).toUpperCase();
}

export default function ExperienceDashboardContent({
  displayName,
  variant = "desktop",
}: ExperienceDashboardContentProps) {
  const isMobile = variant === "mobile";

  return (
    <>
      <div
        className={
          isMobile
            ? "relative z-20 flex items-center justify-between px-3 pb-0 pt-[max(0.35rem,env(safe-area-inset-top))]"
            : "relative z-20 flex items-center justify-between px-4 pb-1 pt-[max(0.25rem,env(safe-area-inset-top))]"
        }
      >
        <AwakeningMenuButton />
        <ProfileOrb initials={profileOrbInitials(displayName)} size="sm" />
      </div>

      <AwakeningHeader displayName={displayName} />

      <AwakeningHeroCTA variant={variant} />
    </>
  );
}
