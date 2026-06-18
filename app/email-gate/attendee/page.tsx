import AttendeeFunnelClient from "@/components/auth/AttendeeFunnelClient";
import { DEFAULT_ATTENDEE_NEXT, resolveAttendeeDestination } from "@/lib/auth/routing";

type AttendeeGatePageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function AttendeeGatePage({ searchParams }: AttendeeGatePageProps) {
  const params = await searchParams;
  const nextPath = resolveAttendeeDestination(params.next ?? DEFAULT_ATTENDEE_NEXT);

  return (
    <AttendeeFunnelClient nextPath={nextPath} authError={params.error ?? null} />
  );
}
