"use client";

import { useSearchParams } from "next/navigation";
import EmailGatePersonaPlate from "@/components/email-gate/EmailGatePersonaPlate";
import {
  buildAttendeeGateUrl,
  buildTeamGateUrl,
  sanitizeNextPath,
  setAuthNextCookie,
  DEFAULT_ATTENDEE_NEXT,
  DEFAULT_TEAM_NEXT,
} from "@/lib/auth/routing";

export default function EmailGatePageClient() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const attendeeNext = sanitizeNextPath(rawNext, DEFAULT_ATTENDEE_NEXT);
  const teamNext = sanitizeNextPath(rawNext, DEFAULT_TEAM_NEXT);

  return (
    <EmailGatePersonaPlate
      attendeeHref={buildAttendeeGateUrl(attendeeNext)}
      teamHref={buildTeamGateUrl(rawNext?.startsWith("/ops") ? rawNext : teamNext)}
      onAttendeeSelect={() => setAuthNextCookie(attendeeNext)}
    />
  );
}
