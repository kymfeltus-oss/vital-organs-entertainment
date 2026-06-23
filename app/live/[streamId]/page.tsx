import LiveStreamScreen from "@/components/live/LiveStreamScreen";

export const dynamic = "force-dynamic";

type LiveStreamPageProps = {
  params: Promise<{ streamId: string }>;
};

/** Full-screen social-style live experience at /live/[streamId]. */
export default async function LiveStreamPage({ params }: LiveStreamPageProps) {
  const { streamId } = await params;
  return <LiveStreamScreen streamId={streamId} />;
}
