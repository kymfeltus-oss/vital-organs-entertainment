import type { Metadata } from "next";
import LivStreamSetup from "../../components/LivStreamSetup";

export const metadata: Metadata = {
  title: "LIV Golf Stream Setup",
  description:
    "Production ingest, realtime stream-state-sync controls, and master go-live for LIV Golf Penstriman.",
};

/**
 * Stream setup configuration — binds to live_stream_state (current_event)
 * and event_countdown_config.start_time via owner show-setup + stream-setup APIs.
 */
export default function LivGolfStreamSetupPage() {
  return <LivStreamSetup />;
}
