"use client";

import {
  HandHeart,
  HeartHandshake,
  Music2,
  Radio,
  Sprout,
} from "lucide-react";
import ActionCard from "@/components/ui/layout/ActionCard";
import AppHeader from "@/components/ui/layout/AppHeader";
import HeroBanner from "@/components/ui/layout/HeroBanner";
import PageContainer from "@/components/ui/layout/PageContainer";
import TenantMenuButton from "@/components/ui/shell/TenantMenuButton";
import ProfileOrbEditor from "@/components/profile/ProfileOrbEditor";
import { useTheme } from "@/components/theme/ThemeProvider";
import { EXPERIENCE_LIVE_PATH } from "@/lib/experience/live-routes";
import { useAttendeeLiveNavTarget } from "@/lib/experience/useAttendeeLiveNavTarget";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";
import type { CountdownParts } from "@/lib/live/event-lobby";
import { useLobbyCountdown } from "@/lib/live/useLobbyCountdown";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type GenericDashboardViewProps = {
  profile: AttendeeProfileSnapshot;
  onProfileChange: (profile: AttendeeProfileSnapshot) => void;
  initialCountdownConfig?: EventCountdownConfig;
  initialCountdown?: CountdownParts;
};

export default function GenericDashboardView({
  profile,
  onProfileChange,
  initialCountdownConfig,
  initialCountdown,
}: GenericDashboardViewProps) {
  const { theme } = useTheme();
  const welcomeName = !profile.isGuest ? profile.firstName.trim() : "";

  useLobbyCountdown({
    initialConfig: initialCountdownConfig,
    initialCountdown,
  });

  const { href: liveNavHref } = useAttendeeLiveNavTarget({
    initialConfig: initialCountdownConfig,
  });

  const actions = [
    theme.features.showMusic
      ? {
          id: "music",
          label: "Music",
          description: "Listen, download, and share",
          href: "/music",
          icon: Music2,
        }
      : null,
    theme.features.showLive
      ? {
          id: "live",
          label: "Live",
          description: "Join the live experience",
          href: liveNavHref || EXPERIENCE_LIVE_PATH,
          icon: Radio,
        }
      : null,
    theme.features.showGiving
      ? {
          id: "giving",
          label: "Giving",
          description: "Support the mission",
          href: "/giving",
          icon: HeartHandshake,
        }
      : null,
    theme.features.showPrayer
      ? {
          id: "prayer",
          label: "Prayer",
          description: "Send encouragement",
          href: "/prayer",
          icon: HandHeart,
        }
      : null,
    theme.features.showBuySeeds
      ? {
          id: "buy-seeds",
          label: "Buy Seeds",
          description: "Get seed packs",
          href: "/buy-seeds",
          icon: Sprout,
        }
      : null,
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return (
    <div
      className="flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden"
      style={{ background: "var(--theme-app-gradient)" }}
    >
      <AppHeader
        actions={
          <>
            <ProfileOrbEditor profile={profile} onProfileChange={onProfileChange} size={36} />
            <TenantMenuButton className="shrink-0" />
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <PageContainer maxWidth="lg" className="space-y-6">
          {welcomeName ? (
            <section>
              <p className="text-sm font-medium" style={{ color: "var(--theme-text-muted)" }}>
                Welcome back
              </p>
              <h1
                className="mt-1 text-2xl font-semibold"
                style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
              >
                {welcomeName}
              </h1>
            </section>
          ) : (
            <section>
              <h1
                className="text-2xl font-semibold"
                style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
              >
                {theme.appName}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                {theme.tagline}
              </p>
            </section>
          )}

          {theme.features.showStory ? (
            <HeroBanner
              title="Featured Story"
              description="Watch the latest featured video from your event."
              href="/story"
              ctaLabel="Watch now"
            />
          ) : null}

          <section aria-label="Quick actions">
            <h2
              className="mb-3 text-sm font-semibold uppercase tracking-wide"
              style={{ color: "var(--theme-text-muted)" }}
            >
              Explore
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {actions.map((action) => (
                <ActionCard
                  key={action.id}
                  href={action.href}
                  label={action.label}
                  description={action.description}
                  icon={action.icon}
                />
              ))}
            </div>
          </section>
        </PageContainer>
      </div>
    </div>
  );
}
