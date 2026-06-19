import type { Metadata } from "next";
import { cookies } from "next/headers";
import AttendeeFunnelClient from "@/components/auth/AttendeeFunnelClient";
import {
  AUTH_NEXT_COOKIE,
  DEFAULT_ATTENDEE_NEXT,
  resolveAttendeeDestination,
} from "@/lib/auth/routing";
import { DEVICE_FIT_PAGE } from "@/lib/responsive";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Log In | 300 Awakening",
  description: "Log in to continue your 300 Awakening journey.",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
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
      aria-label="Log in"
    >
      <AttendeeFunnelClient nextPath={nextPath} authError={params.error ?? null} />
    </main>
  );
}
