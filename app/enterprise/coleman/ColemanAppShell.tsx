"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ColemanIntroFlash from "./ColemanIntroFlash";
import { COLEMAN_ROUTES } from "./lib/routes";

const ENTERED_KEY = "coleman-entered";

export default function ColemanAppShell() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const entered = sessionStorage.getItem(ENTERED_KEY) === "1";
    if (entered) {
      router.replace(COLEMAN_ROUTES.home);
      return;
    }
    setReady(true);
  }, [router]);

  const handleEnter = () => {
    sessionStorage.setItem(ENTERED_KEY, "1");
    setHasEntered(true);
    router.push(COLEMAN_ROUTES.home);
  };

  if (!ready || hasEntered) {
    return null;
  }

  return (
    <div className="coleman-app-shell h-full">
      <ColemanIntroFlash onEnter={handleEnter} />
    </div>
  );
}
