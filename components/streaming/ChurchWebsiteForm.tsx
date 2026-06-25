"use client";

import { TS } from "@/components/todays-service/ServiceUi";
import type { ChurchWebsiteSettings } from "@/lib/streaming/types";

type ChurchWebsiteFormProps = {
  value: ChurchWebsiteSettings;
  onChange: (value: ChurchWebsiteSettings) => void;
  disabled?: boolean;
};

export default function ChurchWebsiteForm({ value, onChange, disabled }: ChurchWebsiteFormProps) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Website Name</span>
        <input
          value={value.websiteName}
          onChange={(e) => onChange({ ...value, websiteName: e.target.value })}
          className={TS.input}
          disabled={disabled}
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Stream Page URL</span>
        <input
          value={value.streamPageUrl}
          onChange={(e) => onChange({ ...value, streamPageUrl: e.target.value })}
          className={TS.input}
          disabled={disabled}
          placeholder="https://yourchurch.org/live"
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-ui text-[0.52rem] uppercase tracking-[0.1em] text-white/45">Embed Method</span>
        <select
          value={value.embedMethod}
          onChange={(e) => onChange({ ...value, embedMethod: e.target.value })}
          className={TS.input}
          disabled={disabled}
        >
          <option value="iframe">Embed on page</option>
          <option value="link">Link to stream page</option>
        </select>
      </label>
    </div>
  );
}
