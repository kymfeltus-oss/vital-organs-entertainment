"use client";

import dynamic from "next/dynamic";

const BroadcastConsoleShell = dynamic(
  () => import("@/components/broadcast/BroadcastConsoleShell"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-dvh items-center justify-center bg-brand-black font-ui text-xs uppercase tracking-[0.14em] text-brand-muted">
        Loading broadcast console…
      </div>
    ),
  },
);

/** Client-only entry — keeps production console out of unrelated route chunks. */
export default function BroadcastConsoleEntry() {
  return <BroadcastConsoleShell />;
}
