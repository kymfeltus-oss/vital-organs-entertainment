"use client";

import Link from "next/link";
import { Radio, Heart, Music, ShoppingBag, Newspaper, MessageCircle } from "lucide-react";
import type { ExperienceHubStatus } from "@/lib/experience/load-experience-hub-status";
import { CONTENT_WITH_NAV } from "@/lib/responsive";

type ExperienceHubClientProps = {
  initialStatus: ExperienceHubStatus;
};

const SECONDARY_LINKS = [
  {
    href: "/experience/prayer",
    label: "Prayer Wall",
    description: "Share requests and testimonies with the fellowship.",
    icon: MessageCircle,
  },
  {
    href: "/experience/giving",
    label: "Vital Seed",
    description: "Harvest stats, giving ledger, and seed contributions.",
    icon: Heart,
  },
  {
    href: "/experience/music",
    label: "Music",
    description: "Featured releases and audio promos.",
    icon: Music,
  },
  {
    href: "/dashboard/merch",
    label: "Merch",
    description: "Official 300 Awakening drops and live-pass checkout.",
    icon: ShoppingBag,
  },
  {
    href: "/updates",
    label: "Event Updates",
    description: "Communications, countdown events, and hub alerts.",
    icon: Newspaper,
  },
] as const;

export default function ExperienceHubClient({ initialStatus }: ExperienceHubClientProps) {
  const { isLive, headline, statusLabel, eyebrow } = initialStatus;

  return (
    <main className={`${CONTENT_WITH_NAV} min-h-dvh w-full bg-brand-black pt-safe pb-safe text-white`}>
      <div className="w-full px-4 py-6 md:px-8 lg:px-10">
        <header className="mb-8">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-blue">
            {eyebrow || "300 Awakening"}
          </p>
          <h1 className="mt-2 font-headline text-fluid-section uppercase tracking-[0.12em]">
            Experience Hub
          </h1>
          <p className="mt-3 max-w-2xl font-body text-sm text-brand-muted">
            {headline} — {statusLabel}
          </p>
        </header>

        {isLive ? (
          <Link
            href="/experience/live"
            className="glass-panel mb-8 block rounded-2xl border border-brand-blue/40 p-6 transition hover:border-brand-blue/70 hover:shadow-[0_0_40px_rgba(0,168,255,0.15)]"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.24em] text-brand-pink">
                  Live Now
                </p>
                <h2 className="mt-2 font-card-title text-2xl uppercase tracking-[0.1em] text-white md:text-3xl">
                  Join Live Show
                </h2>
                <p className="mt-2 font-body text-sm text-brand-muted">
                  The broadcast is active. Enter the live room for stream, chat, and reactions.
                </p>
              </div>
              <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-brand-blue/50 bg-brand-blue/10 px-6 font-ui text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-blue">
                Enter Live Room →
              </span>
            </div>
          </Link>
        ) : (
          <div className="glass-panel mb-8 rounded-2xl border border-brand-border p-6">
            <div className="flex items-start gap-3">
              <Radio className="mt-0.5 h-5 w-5 shrink-0 text-brand-muted" aria-hidden="true" />
              <div>
                <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.2em] text-brand-muted">
                  Waiting Room
                </p>
                <p className="mt-2 font-body text-sm text-brand-muted">
                  No active broadcast signal yet. Explore prayer, giving, music, and event updates below.
                </p>
              </div>
            </div>
          </div>
        )}

        <section>
          <h2 className="mb-4 font-ui text-[0.62rem] font-bold uppercase tracking-[0.22em] text-brand-muted">
            Hub Destinations
          </h2>
          <div className="card-grid-responsive">
            {SECONDARY_LINKS.map(({ href, label, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="glass-panel group rounded-2xl border border-brand-border p-5 transition hover:border-brand-blue/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-brand-panel">
                  <Icon className="h-5 w-5 text-brand-blue" aria-hidden="true" />
                </div>
                <h3 className="font-card-title text-lg uppercase tracking-[0.08em] text-white group-hover:text-brand-blue">
                  {label}
                </h3>
                <p className="mt-2 font-body text-xs leading-relaxed text-brand-muted">{description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
