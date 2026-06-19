import { redirect } from "next/navigation";

type ExperienceHoldingRoomPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy holding room URL — pre-live waiting now lives on `/experience/live`. */
export default async function ExperienceHoldingRoomPage({
  searchParams,
}: ExperienceHoldingRoomPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
    }
  }

  const suffix = query.toString();
  redirect(suffix ? `/experience/live?${suffix}` : "/experience/live");
}
