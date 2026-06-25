"use client";

import { Pencil } from "lucide-react";
import { BeginServiceButton, StopServiceButton, TS } from "@/components/todays-service/ServiceUi";
import { countdownLabel } from "@/lib/todays-service/format-service";
import type { ServiceRecord } from "@/lib/todays-service/types";

type ServiceHeaderActionsProps = {
  service: ServiceRecord;
  setupComplete: boolean;
  onEdit: () => void;
  onContinueSetup: () => void;
  onBeginService: () => void;
  onStopService?: () => void;
};

export default function ServiceHeaderActions({
  service,
  setupComplete,
  onEdit,
  onContinueSetup,
  onBeginService,
  onStopService,
}: ServiceHeaderActionsProps) {
  const countdown = countdownLabel(service.serviceDate, service.serviceStartTime);

  return (
    <div className="flex flex-wrap items-start gap-3">
      <button type="button" onClick={onEdit} className={TS.btnOutline}>
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        Edit Service
      </button>
      {service.serviceStartedAt && onStopService ? (
        <StopServiceButton onClick={onStopService} />
      ) : setupComplete ? (
        <BeginServiceButton onClick={onBeginService} sublabel={countdown} />
      ) : (
        <div className="flex flex-col items-end gap-1">
          <button type="button" onClick={onContinueSetup} className={TS.btnCyan}>
            Continue Setup
          </button>
          {countdown ? <span className={TS.captionMuted}>{countdown}</span> : null}
        </div>
      )}
    </div>
  );
}
