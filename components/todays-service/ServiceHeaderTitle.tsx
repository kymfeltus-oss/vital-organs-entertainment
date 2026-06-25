import { Sun } from "lucide-react";
import { formatServiceDate } from "@/lib/todays-service/format-service";
import type { ServiceRecord } from "@/lib/todays-service/types";

type ServiceHeaderTitleProps = {
  service: ServiceRecord;
};

/** Server-rendered LCP candidate — service name and schedule line. */
export default function ServiceHeaderTitle({ service }: ServiceHeaderTitleProps) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <Sun className="h-6 w-6 text-yellow-300" aria-hidden="true" />
        <h1 className="font-headline text-2xl uppercase tracking-[0.1em] text-white md:text-[1.65rem]">
          {service.serviceName}
        </h1>
      </div>
      <p className="mt-1 font-body text-[0.9rem] text-neutral-400">
        {formatServiceDate(service.serviceDate, service.serviceStartTime)}
      </p>
    </div>
  );
}
