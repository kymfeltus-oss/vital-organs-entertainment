"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import GenericTabShell from "@/components/ui/shell/GenericTabShell";
import { APPLE_MUSIC_SINGLE_URL } from "@/lib/music/assets";
import type { AttendeeProfileSnapshot } from "@/lib/profile/attendee-profile";

type MusicPageClientProps = {
  initialProfile: AttendeeProfileSnapshot;
};

export default function MusicPageClient({ initialProfile }: MusicPageClientProps) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <GenericTabShell
      title="Music"
      subtitle="Listen and download"
      profile={profile}
      onProfileChange={setProfile}
    >
      <section className="space-y-4">
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: "var(--theme-border)",
            backgroundColor: "var(--theme-surface)",
          }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
          >
            Featured Release
          </h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
            Stream or purchase the latest single from your event catalog.
          </p>
          <Link
            href={APPLE_MUSIC_SINGLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white touch-target"
            style={{ backgroundColor: "var(--theme-primary)" }}
          >
            Open in Apple Music
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </GenericTabShell>
  );
}
