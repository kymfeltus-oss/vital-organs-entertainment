import type { Metadata } from "next";
import LiveDataLoader from "@/components/experience/live/LiveDataLoader";

/** Dynamic — live playback shell resolves per request. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Live | Vital Organs Entertainment",
  description: "Join the 300 Awakening live experience.",
};

/** Attendee live entry — full-bleed player shell with internal phase handling. */
export default async function LivePage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-brand-black text-brand-blue">
      <LiveDataLoader />
    </div>
  );
}
