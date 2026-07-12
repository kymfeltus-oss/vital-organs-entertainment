import LIVViewerLayout from "../components/LIVViewerLayout";
import { LIV_VIEWER_SHELL } from "@/lib/enterprise/liv-golf/responsive";
import { LIV_GOLF_TOUR_MAIN_ROOM } from "@/lib/live/types";

type ViewerPageProps = {
  searchParams: Promise<{ roomId?: string }>;
};

/** Server-side fan viewer entry — delivers layout shell without client state wrapping. */
export default async function LIVGolfLivePage({ searchParams }: ViewerPageProps) {
  const resolvedParams = await searchParams;
  const roomId = resolvedParams.roomId?.trim() || LIV_GOLF_TOUR_MAIN_ROOM;

  return (
    <main id="main-content" className={`${LIV_VIEWER_SHELL} select-none bg-[#111111]`}>
      <LIVViewerLayout roomId={roomId} />
    </main>
  );
}
