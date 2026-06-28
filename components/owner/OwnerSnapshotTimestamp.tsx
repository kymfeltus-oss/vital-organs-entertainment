"use client";

import { useEffect, useState } from "react";

type OwnerSnapshotTimestampProps = {
  capturedAt: string | null | undefined;
  prefix?: string;
  emptyLabel?: string;
};

/** Client-only locale formatting — avoids SSR/client hydration mismatches. */
export default function OwnerSnapshotTimestamp({
  capturedAt,
  prefix = "Snapshot",
  emptyLabel = "Awaiting snapshot…",
}: OwnerSnapshotTimestampProps) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    if (!capturedAt?.trim()) {
      setFormatted(null);
      return;
    }

    setFormatted(new Date(capturedAt).toLocaleString());
  }, [capturedAt]);

  if (!capturedAt?.trim()) {
    return <>{emptyLabel}</>;
  }

  if (!formatted) {
    return <>{emptyLabel}</>;
  }

  return (
    <>
      {prefix} {formatted}
    </>
  );
}
