"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAccessContext } from "@/lib/access";
import type { ExperienceHubPayload } from "@/lib/experience/hub-content";
import {
  firstNameFromEmail,
  initialsFromIdentity,
} from "@/lib/experience/user-profile-display";

const HUB_REFRESH_MS = 30_000;

export function useExperienceHubLiveState(initialPayload: ExperienceHubPayload) {
  const [livePayload, setLivePayload] = useState(initialPayload);
  const [clientUser, setClientUser] = useState(initialPayload.user);

  useEffect(() => {
    let cancelled = false;

    void fetchAccessContext().then((context) => {
      if (cancelled) return;

      setClientUser((prev) => {
        if (!context.email) {
          return { email: null, firstName: "", initials: "" };
        }

        if (prev.email === context.email) {
          return { ...prev, email: context.email };
        }

        return {
          email: context.email,
          firstName: firstNameFromEmail(context.email),
          initials: initialsFromIdentity(context.email, null),
        };
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshHub() {
      try {
        const response = await fetch("/api/experience/hub", {
          cache: "no-store",
        });

        if (!response.ok || cancelled) return;

        const data = (await response.json()) as ExperienceHubPayload;
        if (cancelled) return;
        setLivePayload(data);
        // #region agent log
        fetch("http://127.0.0.1:7287/ingest/924e23f7-c306-4f6a-be8c-fe2ff2718b00", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "baf5b9" },
          body: JSON.stringify({
            sessionId: "baf5b9",
            runId: "initial",
            hypothesisId: "E",
            location: "useExperienceHubLiveState.ts:refreshHub",
            message: "Hub payload refreshed",
            data: { ok: true },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      } catch {
        /* keep last good payload */
      }
    }

    void refreshHub();
    const intervalId = window.setInterval(() => {
      void refreshHub();
    }, HUB_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return useMemo(
    () => ({
      ...livePayload,
      user: clientUser,
    }),
    [clientUser, livePayload],
  );
}
