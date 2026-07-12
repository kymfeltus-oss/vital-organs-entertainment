import LIVViewerLayout from "../components/LIVViewerLayout";
import { resolveLivGolfRoomId } from "@/lib/live/liv-golf-room";

type ViewerPageProps = {
  searchParams: Promise<{ roomId?: string }>;
};

/** Fan live viewer — blueprint shell in LIVViewerLayout (stream + top-4/right-4/bottom-4 overlay). */
export default async function LIVGolfLivePage({ searchParams }: ViewerPageProps) {
  const resolvedParams = await searchParams;
  const roomId = resolveLivGolfRoomId(resolvedParams.roomId);

  return (
    <main id="main-content" className="min-h-screen select-none bg-neutral-950">
      <LIVViewerLayout roomId={roomId} />
    </main>
  );
}
