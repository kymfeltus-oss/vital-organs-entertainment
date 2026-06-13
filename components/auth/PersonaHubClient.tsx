"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Radio, Shield } from "lucide-react";
import EmailGateShell from "@/components/auth/EmailGateShell";
import {
  buildAttendeeGateUrl,
  buildTeamGateUrl,
  sanitizeNextPath,
  DEFAULT_ATTENDEE_NEXT,
  DEFAULT_TEAM_NEXT,
} from "@/lib/auth/routing";

export default function PersonaHubClient() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const attendeeNext = sanitizeNextPath(rawNext, DEFAULT_ATTENDEE_NEXT);
  const teamNext = sanitizeNextPath(rawNext, DEFAULT_TEAM_NEXT);

  const attendeeHref = buildAttendeeGateUrl(attendeeNext);
  const teamHref = buildTeamGateUrl(
    rawNext?.startsWith("/ops") ? rawNext : teamNext,
  );

  return (
    <EmailGateShell
      eyebrow="300 Awakening Entry Hub"
      title="Select Your Path"
      description="Choose how you are entering the experience. Attendees join the live awakening. Promoters and production teams access broadcast and ops consoles."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={attendeeHref} className="group block">
          <article className="flex h-full min-h-[180px] flex-col rounded-2xl border border-brand-border bg-brand-black p-5 transition hover:border-brand-blue/50 hover:shadow-[0_0_30px_rgba(0,168,255,0.15)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/10">
              <Radio className="h-5 w-5 text-brand-blue" aria-hidden="true" />
            </div>
            <h2 className="font-card-title text-lg uppercase tracking-[0.08em] text-white">
              Attendee Entrance
            </h2>
            <p className="mt-2 flex-1 font-body text-xs leading-relaxed text-brand-muted">
              Log in, create an account, or continue as a guest to enter the live experience and event lobby.
            </p>
            <span className="mt-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-blue group-hover:underline">
              Continue as Attendee →
            </span>
          </article>
        </Link>

        <Link href={teamHref} className="group block">
          <article className="flex h-full min-h-[180px] flex-col rounded-2xl border border-brand-border bg-brand-black p-5 transition hover:border-brand-pink/50 hover:shadow-[0_0_30px_rgba(255,0,140,0.15)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-brand-pink/30 bg-brand-pink/10">
              <Shield className="h-5 w-5 text-brand-pink" aria-hidden="true" />
            </div>
            <h2 className="font-card-title text-lg uppercase tracking-[0.08em] text-white">
              Promoter &amp; Production Team Login
            </h2>
            <p className="mt-2 flex-1 font-body text-xs leading-relaxed text-brand-muted">
              Secure credentials for PARABLE broadcast control, readiness gates, and operator live hub access.
            </p>
            <span className="mt-4 font-ui text-[0.58rem] font-bold uppercase tracking-[0.14em] text-brand-pink group-hover:underline">
              Team Secure Login →
            </span>
          </article>
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-brand-border bg-brand-panel/60 px-4 py-3">
        <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.16em] text-brand-muted">
          Routing Intersection
        </p>
        <p className="mt-1 font-body text-xs text-brand-muted">
          Attendee path preserves your destination (
          <span className="text-white">{attendeeNext}</span>). Team path defaults to broadcast console access.
        </p>
      </div>
    </EmailGateShell>
  );
}
