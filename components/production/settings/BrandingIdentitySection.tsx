"use client";

import ThemeFormField from "@/components/admin/branding/ThemeFormField";
import type { TenantTheme } from "@/lib/theme/types";

type BrandingIdentitySectionProps = {
  appName: string;
  tagline: string;
  disabled?: boolean;
  onChange: (patch: Partial<Pick<TenantTheme, "appName" | "tagline">>) => void;
};

export default function BrandingIdentitySection({
  appName,
  tagline,
  disabled = false,
  onChange,
}: BrandingIdentitySectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
        Core identity strings appear in headers, metadata, and the live preview panel.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ThemeFormField label="App name" htmlFor="owner-app-name">
          <input
            id="owner-app-name"
            type="text"
            value={appName}
            disabled={disabled}
            onChange={(event) => onChange({ appName: event.target.value })}
            className="theme-input w-full rounded-xl px-4 py-2.5 text-sm"
            placeholder="Parable Streaming"
          />
        </ThemeFormField>

        <ThemeFormField label="Tagline" htmlFor="owner-tagline">
          <input
            id="owner-tagline"
            type="text"
            value={tagline}
            disabled={disabled}
            onChange={(event) => onChange({ tagline: event.target.value })}
            className="theme-input w-full rounded-xl px-4 py-2.5 text-sm"
            placeholder="Premium white-label media & community engine"
          />
        </ThemeFormField>
      </div>
    </div>
  );
}
