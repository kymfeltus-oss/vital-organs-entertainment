import { redirect } from "next/navigation";

type IgLiveLegacyPageProps = {
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

/** Legacy IG preview URL — attendee live is unified at `/experience/live`. */
export default async function IgLiveLegacyRedirectPage({ searchParams }: IgLiveLegacyPageProps) {
  const params = await searchParams;
  redirect(`/experience/live${buildQueryString(params)}`);
}
