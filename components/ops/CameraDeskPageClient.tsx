"use client";

import { useEffect, useState } from "react";
import CameraDeskMobileView from "@/components/ops/CameraDeskMobileView";

export default function CameraDeskPageClient() {
  const [phoneStreamKey, setPhoneStreamKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initializeMobileSession() {
      try {
        const response = await fetch("/api/ops/camera-desk/session", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operatorName: "phone_operator" }),
          cache: "no-store",
        });

        const data = (await response.json()) as {
          success?: boolean;
          streamKey?: string;
          error?: string;
        };

        if (!response.ok || !data.success || !data.streamKey) {
          throw new Error(data.error ?? "Unable to register mobile stream key.");
        }

        if (!cancelled) {
          setPhoneStreamKey(data.streamKey);
          console.info(`Mobile stream key locked: ${data.streamKey}`);
        }
      } catch (error) {
        console.error("Failed to register mobile console keys with database", error);
      }
    }

    void initializeMobileSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return <CameraDeskMobileView phoneStreamKey={phoneStreamKey} />;
}
