"use client";

import { useEffect, useState } from "react";
import {
  buildAttendeeProfileSnapshot,
  type AttendeeProfileSnapshot,
} from "@/lib/profile/attendee-profile";

export function useMenuScreenProfile() {
  const [profile, setProfile] = useState<AttendeeProfileSnapshot>(() =>
    buildAttendeeProfileSnapshot(null),
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/profile", { credentials: "include" });
        if (!response.ok) return;

        const data = (await response.json()) as { profile?: AttendeeProfileSnapshot };
        if (!cancelled && data.profile) {
          setProfile(data.profile);
        }
      } catch {
        /* keep guest snapshot */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, setProfile };
}
