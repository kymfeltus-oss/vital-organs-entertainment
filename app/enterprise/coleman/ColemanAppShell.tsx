"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import ColemanIntroFlash from "./ColemanIntroFlash";
import ColemanHomeBootLoader from "./components/home/ColemanHomeBootLoader";
import { useClientMountGate } from "./lib/hooks/useClientMountGate";
import { hasEnteredColemanSession } from "./lib/intro-session";
import { COLEMAN_ROUTES } from "./lib/routes";

export default function ColemanAppShell() {
  const router = useRouter();
  const isClientRouterReady = useClientMountGate();
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isClientRouterReady) {
      return;
    }

    const entered = hasEnteredColemanSession();
    if (entered) {
      router.replace(COLEMAN_ROUTES.home);
      return;
    }
    setShowIntro(true);
  }, [isClientRouterReady, router]);

  if (!isClientRouterReady) {
    return (
      <div className="coleman-app-shell">
        <ColemanHomeBootLoader />
      </div>
    );
  }

  if (showIntro !== true) {
    return null;
  }

  return (
    <div className="coleman-app-shell">
      <ColemanIntroFlash />
    </div>
  );
}
