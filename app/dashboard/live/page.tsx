import { Suspense } from "react";
import LiveRoomClient from "@/components/live/LiveRoomClient";
import LightweightLiveLoading from "@/components/live/LightweightLiveLoading";

/**
 * Attendee live room — public/user-facing after email gate. Mobile-friendly.
 * No vMix, Restream, ops readiness, or Go Live controls belong here.
 * Operator production console: /ops/live-hub (ops-admin, desktop-only).
 *
 * Performance: measure LCP with `npm run build && npm run start`, not `next dev`.
 * Dev HMR/WebSocket overhead inflates hydration metrics. Test without browser extensions.
 */
export default function LiveRoomPage() {
  return (
    <Suspense fallback={<LightweightLiveLoading />}>
      <LiveRoomClient />
    </Suspense>
  );
}
