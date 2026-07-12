import LIVViewerLayout from "../components/LIVViewerLayout";
import { resolveLivGolfRoomId } from "@/lib/live/liv-golf-room";
import { LIV_VIEWER_SHELL } from "@/lib/enterprise/liv-golf/responsive";

type ViewerPageProps = {
  searchParams: Promise<{ roomId?: string }>;
};

/** Server-side fan viewer entry — delivers layout shell without client state wrapping. */
export default async function LIVGolfLivePage({ searchParams }: ViewerPageProps) {
  const resolvedParams = await searchParams;
  const roomId = resolveLivGolfRoomId(resolvedParams.roomId);

  return (
    <main id="main-content" className={`${LIV_VIEWER_SHELL} select-none bg-[#111111]`}>
      <LIVViewerLayout roomId={roomId} />
    </main>
  );
}
