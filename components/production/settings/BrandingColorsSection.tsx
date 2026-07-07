"use client";

import ThemeColorField from "@/components/admin/branding/ThemeColorField";
import ThemeFormField from "@/components/admin/branding/ThemeFormField";
import type { TenantTheme } from "@/lib/theme/types";

type BrandingColorsSectionProps = {
  colors: TenantTheme["colors"];
  disabled?: boolean;
  onColorChange: (key: keyof TenantTheme["colors"], value: string) => void;
};

const COLOR_FIELDS: { key: keyof TenantTheme["colors"]; label: string; token: string }[] = [
  { key: "primary", label: "Primary", token: "--theme-primary" },
  { key: "secondary", label: "Secondary", token: "--theme-secondary" },
  { key: "background", label: "Background", token: "--theme-bg" },
  { key: "surface", label: "Surface", token: "--theme-surface" },
  { key: "text", label: "Text", token: "--theme-text" },
];

export default function BrandingColorsSection({
  colors,
  disabled = false,
  onColorChange,
}: BrandingColorsSectionProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
        Color tokens map directly to CSS variables on <code className="font-mono text-xs">:root</code>.
        Changes preview instantly across the workspace.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {COLOR_FIELDS.map((field) => (
          <ThemeColorField
            key={field.key}
            id={`owner-color-${field.key}`}
            label={`${field.label} (${field.token})`}
            value={colors[field.key]}
            onChange={(value) => onColorChange(field.key, value)}
          />
        ))}
      </div>
      {disabled ? (
        <p className="text-xs font-medium" style={{ color: "var(--theme-text-muted)" }}>
          Enterprise profile is active — palette editing is locked.
        </p>
      ) : null}
    </div>
  );
}
