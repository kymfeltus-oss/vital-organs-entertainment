"use client";

import type { ReactNode } from "react";
import AppHeader from "@/components/ui/layout/AppHeader";
import PageContainer from "@/components/ui/layout/PageContainer";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";
import { cn } from "@/lib/utils";

type GenericTabShellProps = {
  title: string;
  subtitle?: string;
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  children: ReactNode;
  className?: string;
};

/** Flexible tab page wrapper — no PNG artboard or dimension-locked overlays. */
export default function GenericTabShell({
  title,
  subtitle,
  profile,
  onProfileChange,
  children,
  className,
}: GenericTabShellProps) {
  return (
    <div
      className={cn("flex min-h-0 w-full flex-1 flex-col", className)}
      style={{ background: "var(--theme-app-gradient)" }}
    >
      <AppHeader
        showLogo={false}
        title={title}
        subtitle={subtitle}
        actions={<ProfileOrbEditor profile={profile} onProfileChange={onProfileChange} size={36} />}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PageContainer maxWidth="md">{children}</PageContainer>
      </div>
    </div>
  );
}
