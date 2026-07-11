import LIVViewerLayout from "../components/LIVViewerLayout";
import { resolveLivGolfRoomId } from "@/lib/live/liv-golf-room";

type ViewerPageProps = {
  searchParams: Promise<{ roomId?: string }>;
};

export default async function LIVGolfLivePage({ searchParams }: ViewerPageProps) {
  const resolvedParams = await searchParams;
  const roomId = resolveLivGolfRoomId(resolvedParams.roomId);

  return (
    <main className="h-screen w-full select-none overflow-hidden bg-[#111111]">
      <LIVViewerLayout roomId={roomId} />
    </main>
  );
}
