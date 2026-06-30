import type { Metadata } from "next";
import LiveDataLoader from "@/components/experience/live/LiveDataLoader";

/** Dynamic — manifest + env playback resolved per request; no static asset preloads. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Live | Vital Organs Entertainment",
  description: "Join the 300 Awakening live experience.",
};

/** Attendee live entry — publishing is owner-only at /owner/publish/camera. */
export default function LivePage() {
  return <LiveDataLoader />;
}
