"use client";

import AdvancedSettingsAccordion from "@/components/todays-service/AdvancedSettingsAccordion";
import { TS } from "@/components/todays-service/ServiceUi";
import type { CustomRtmpSettings } from "@/lib/streaming/types";

type CustomRtmpFormProps = {
  value: CustomRtmpSettings;
  onChange: (value: CustomRtmpSettings) => void;
  disabled?: boolean;
};

export default function CustomRtmpForm({ value, onChange, disabled }: CustomRtmpFormProps) {
  return (
    <AdvancedSettingsAccordion title="Advanced Setup">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Server Name</span>
          <input
            value={value.serverName}
            onChange={(e) => onChange({ ...value, serverName: e.target.value })}
            className={TS.input}
            disabled={disabled}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Stream URL</span>
          <input
            value={value.streamUrl}
            onChange={(e) => onChange({ ...value, streamUrl: e.target.value })}
            className={TS.input}
            disabled={disabled}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Stream Key</span>
          <input
            type="password"
            value={value.streamKey}
            onChange={(e) => onChange({ ...value, streamKey: e.target.value })}
            className={TS.input}
            disabled={disabled}
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Backup Stream URL (optional)</span>
          <input
            value={value.backupStreamUrl ?? ""}
            onChange={(e) => onChange({ ...value, backupStreamUrl: e.target.value })}
            className={TS.input}
            disabled={disabled}
          />
        </label>
      </div>
    </AdvancedSettingsAccordion>
  );
}
