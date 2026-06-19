import { redirect } from "next/navigation";
import { experienceLivePathFromRecord } from "@/lib/experience/live-routes";

type ExperienceHoldingRoomPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy holding room URL — pre-live waiting now lives on the live IG route. */
export default async function ExperienceHoldingRoomPage({
  searchParams,
}: ExperienceHoldingRoomPageProps) {
  const params = await searchParams;
  redirect(experienceLivePathFromRecord(params));
}
