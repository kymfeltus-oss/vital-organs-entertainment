"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OwnerCameraPublisher from "@/components/owner/OwnerCameraPublisher";
import type { OwnerPublisherSession } from "@/lib/owner/contracts";

export default function OwnerCameraPageClient() {
  const [session, setSession] = useState<OwnerPublisherSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function ensureSession() {
      try {
        const response = await fetch("/api/owner/publisher/session", {
          method: "POST",
          credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
          if (!cancelled) {
            setError("Owner access denied. Sign in with an ADMIN_EMAILS account.");
          }
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to create publisher session.");
        }

        const data = (await response.json()) as { session?: OwnerPublisherSession };
        if (!cancelled && data.session) setSession(data.session);
      } catch (sessionError) {
        if (!cancelled) {
          setError(
            sessionError instanceof Error ? sessionError.message : "Session failed.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void ensureSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center p-6 text-slate-100">
        <p className="font-body text-sm text-slate-400">Preparing owner camera session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-slate-100">
        <p className="font-body text-sm text-red-300">{error ?? "No publisher session."}</p>
        <Link href="/owner/control" className="font-ui text-xs uppercase tracking-[0.14em] text-sky-400">
          Back to control room
        </Link>
      </div>
    );
  }

  return (
    <OwnerCameraPublisher
      liveChannel={session.channel}
      browserChannel={session.browserChannel}
      sessionId={session.sessionId}
    />
  );
}
