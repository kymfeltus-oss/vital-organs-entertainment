import CreateAccountClient from "@/components/auth/CreateAccountClient";
import { DEFAULT_ATTENDEE_NEXT, resolveAttendeeDestination } from "@/lib/auth/routing";
import { DEVICE_FIT_PAGE } from "@/lib/responsive";

export const dynamic = "force-dynamic";

type CreateAccountPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CreateAccountPage({ searchParams }: CreateAccountPageProps) {
  const params = await searchParams;
  const nextPath = resolveAttendeeDestination(params.next ?? DEFAULT_ATTENDEE_NEXT);

  return (
    <main
      id="main-content"
      className={`${DEVICE_FIT_PAGE} flex min-h-0 flex-1 flex-col overflow-x-hidden bg-brand-black pt-safe`}
      aria-label="Create account"
    >
      <CreateAccountClient nextPath={nextPath} />
    </main>
  );
}
