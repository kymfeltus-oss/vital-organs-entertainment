import CreateAccountClient from "@/components/auth/CreateAccountClient";
import { DEFAULT_ATTENDEE_NEXT, resolveAttendeeDestination } from "@/lib/auth/routing";

type CreateAccountPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CreateAccountPage({ searchParams }: CreateAccountPageProps) {
  const params = await searchParams;
  const nextPath = resolveAttendeeDestination(params.next ?? DEFAULT_ATTENDEE_NEXT);

  return <CreateAccountClient nextPath={nextPath} />;
}
