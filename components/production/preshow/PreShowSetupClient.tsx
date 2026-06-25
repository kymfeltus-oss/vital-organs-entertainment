"use client";

import PreShowChatWizard from "@/components/production/preshow/PreShowChatWizard";
import PreShowPreviewMonitors from "@/components/production/preshow/PreShowPreviewMonitors";
import PreShowReadinessPanel from "@/components/production/preshow/PreShowReadinessPanel";
import PreShowSettingsSummary from "@/components/production/preshow/PreShowSettingsSummary";
import { usePreShowSetup } from "@/hooks/production/usePreShowSetup";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

type PreShowSetupClientProps = {
  initialConfig: EventCountdownConfig;
  operatorEmail: string;
};

export default function PreShowSetupClient({
  initialConfig,
  operatorEmail,
}: PreShowSetupClientProps) {
  const setup = usePreShowSetup({ initialConfig });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="border-b border-brand-border pb-3">
        <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
          Signed in as {operatorEmail}
        </p>
        <h1 className="font-headline text-2xl uppercase tracking-[0.12em] text-white md:text-3xl">
          Production Pre-Show Setup
        </h1>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[380px_1fr_320px]">
        <PreShowChatWizard setup={setup} />
        <div className="flex min-h-0 flex-col gap-4">
          <PreShowPreviewMonitors setup={setup} />
          <PreShowSettingsSummary setup={setup} />
        </div>
        <PreShowReadinessPanel setup={setup} />
      </div>
    </div>
  );
}
