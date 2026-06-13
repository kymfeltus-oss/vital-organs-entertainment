"use client";

import BroadcastConsole from "@/components/broadcast/BroadcastConsole";
import { BroadcastHealthProvider } from "@/lib/parable/BroadcastHealthContext";

export default function BroadcastConsoleShell() {
  return (
    <BroadcastHealthProvider surface="broadcast">
      <BroadcastConsole />
    </BroadcastHealthProvider>
  );
}
