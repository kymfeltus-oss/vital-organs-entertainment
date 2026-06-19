import type { Metadata } from "next";
import { cookies } from "next/headers";
import CreateAccountClient from "@/components/auth/CreateAccountClient";
import {
  AUTH_NEXT_COOKIE,
  DEFAULT_ATTENDEE_NEXT,
  resolveAttendeeDestination,
} from "@/lib/auth/routing";
import { DEVICE_FIT_PAGE } from "@/lib/responsive";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account | 300 Awakening",
  description: "Create your 300 Awakening account.",
};

type CreateAccountPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CreateAccountPage({ searchParams }: CreateAccountPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const nextFromCookie = cookieStore.get(AUTH_NEXT_COOKIE)?.value;
  const nextPath = resolveAttendeeDestination(
    params.next ?? nextFromCookie ?? DEFAULT_ATTENDEE_NEXT,
  );

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
