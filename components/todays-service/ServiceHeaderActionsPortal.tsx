"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import ServiceHeaderActions from "@/components/todays-service/ServiceHeaderActions";
import type { ServiceRecord } from "@/lib/todays-service/types";

const SLOT_ID = "todays-service-header-actions";

type ServiceHeaderActionsPortalProps = {
  service: ServiceRecord;
  setupComplete: boolean;
  onEdit: () => void;
  onContinueSetup: () => void;
  onBeginService: () => void;
  onStopService?: () => void;
};

export default function ServiceHeaderActionsPortal(props: ServiceHeaderActionsPortalProps) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setSlot(document.getElementById(SLOT_ID));
  }, []);

  if (!slot) return null;

  return createPortal(<ServiceHeaderActions {...props} />, slot);
}

export { SLOT_ID };
