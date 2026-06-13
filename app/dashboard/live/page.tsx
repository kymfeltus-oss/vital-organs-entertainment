import { redirect } from "next/navigation";

type DashboardLivePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function buildQueryString(params: Record<string, string | string[] | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry);
      }
      continue;
    }
    query.set(key, value);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

/**
 * Legacy attendee live entry — forwards to the cinematic /experience/live viewport.
 */
export default async function LiveRoomPage({ searchParams }: DashboardLivePageProps) {
  const params = await searchParams;
  redirect(`/experience/live${buildQueryString(params)}`);
}
