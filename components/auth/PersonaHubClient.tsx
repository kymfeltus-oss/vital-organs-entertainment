"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
    <EmailGateShell>
      <div className="flex flex-col gap-3">
        <Link
          href={attendeeHref}
          className="flex min-h-11 items-center justify-center rounded-lg border border-brand-border px-4 py-2 text-sm text-white"
        >
          Attendee — log in or create account
        </Link>
        <Link
          href={teamHref}
          className="flex min-h-11 items-center justify-center rounded-lg border border-brand-border px-4 py-2 text-sm text-brand-muted"
        >
          Team login
        </Link>
      </div>
    </EmailGateShell>
  );
}
