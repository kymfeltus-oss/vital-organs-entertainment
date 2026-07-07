"use client";

import ThemeFormField from "@/components/admin/branding/ThemeFormField";
import type { TenantTheme } from "@/lib/theme/types";

type BrandingAssetsSectionProps = {
  logoUrl: string | null;
  faviconUrl: string | null;
  disabled?: boolean;
  onChange: (patch: Partial<Pick<TenantTheme, "logoUrl" | "faviconUrl">>) => void;
};

function AssetPreview({
  label,
  src,
  size,
}: {
  label: string;
  src: string | null;
  size: number;
}) {
  if (!src) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed text-xs"
        style={{
          width: size,
          height: size,
          borderColor: "var(--theme-border)",
          color: "var(--theme-text-muted)",
        }}
      >
        No preview
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl border"
      style={{ width: size, height: size, borderColor: "var(--theme-border)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${label} preview`}
        className="h-full w-full object-contain"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

export default function BrandingAssetsSection({
  logoUrl,
  faviconUrl,
  disabled = false,
  onChange,
}: BrandingAssetsSectionProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
        Map public asset paths to <code className="font-mono text-xs">theme.logoUrl</code> and{" "}
        <code className="font-mono text-xs">theme.faviconUrl</code>. Previews update as you type.
      </p>

      <div className="theme-card grid gap-4 rounded-2xl p-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <AssetPreview label="Logo" src={logoUrl} size={96} />
        <ThemeFormField
          label="Logo URL"
          htmlFor="owner-logo-url"
          hint="Absolute or public path, e.g. /tenant-default/logo.png"
        >
          <input
            id="owner-logo-url"
            type="text"
            value={logoUrl ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ logoUrl: event.target.value || null })}
            className="theme-input w-full rounded-xl px-4 py-2.5 text-sm font-mono"
            placeholder="/branding/logo.png"
          />
        </ThemeFormField>
      </div>

      <div className="theme-card grid gap-4 rounded-2xl p-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <AssetPreview label="Favicon" src={faviconUrl} size={48} />
        <ThemeFormField
          label="Favicon URL"
          htmlFor="owner-favicon-url"
          hint="Small icon served from /public"
        >
          <input
            id="owner-favicon-url"
            type="text"
            value={faviconUrl ?? ""}
            disabled={disabled}
            onChange={(event) => onChange({ faviconUrl: event.target.value || null })}
            className="theme-input w-full rounded-xl px-4 py-2.5 text-sm font-mono"
            placeholder="/favicon.ico"
          />
        </ThemeFormField>
      </div>
    </div>
  );
}
