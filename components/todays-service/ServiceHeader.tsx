"use client";

import ServiceHeaderActions from "@/components/todays-service/ServiceHeaderActions";
import ServiceHeaderTitle from "@/components/todays-service/ServiceHeaderTitle";
import { TODAYS_SERVICE_SHELL as SHELL } from "@/lib/todays-service/shell-styles";
import type { ServiceRecord } from "@/lib/todays-service/types";

type ServiceHeaderProps = {
  service: ServiceRecord;
  setupComplete: boolean;
  onEdit: () => void;
  onContinueSetup: () => void;
  onBeginService: () => void;
  onStopService?: () => void;
};

export default function ServiceHeader({
  service,
  setupComplete,
  onEdit,
  onContinueSetup,
  onBeginService,
  onStopService,
}: ServiceHeaderProps) {
  return (
    <header className={SHELL.headerRow}>
      <ServiceHeaderTitle service={service} />
      <ServiceHeaderActions
        service={service}
        setupComplete={setupComplete}
        onEdit={onEdit}
        onContinueSetup={onContinueSetup}
        onBeginService={onBeginService}
        onStopService={onStopService}
      />
    </header>
  );
}
