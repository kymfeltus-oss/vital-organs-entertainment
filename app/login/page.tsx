import type { Metadata } from "next";
import { cookies } from "next/headers";
import AttendeeFunnelClient from "@/components/auth/AttendeeFunnelClient";
import {
  AUTH_NEXT_COOKIE,
  DEFAULT_ATTENDEE_NEXT,
  resolveAttendeeDestination,
} from "@/lib/auth/routing";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Log In | ${PLATFORM_APP_NAME}`,
  description: `Log in to continue on ${PLATFORM_APP_NAME}.`,
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
    error_description?: string;
    confirmed?: string;
  }>;
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
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-brand-black"
      aria-label="Log in page"
    >
      <AttendeeFunnelClient
        nextPath={nextPath}
        authError={params.error ?? null}
        authErrorDescription={params.error_description ?? null}
        emailConfirmed={params.confirmed === "1"}
      />
    </main>
  );
}
