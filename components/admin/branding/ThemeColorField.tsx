"use client";

import ThemeFormField from "@/components/admin/branding/ThemeFormField";

type ThemeColorFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function isHexColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
}

export default function ThemeColorField({ id, label, value, onChange }: ThemeColorFieldProps) {
  const pickerValue = isHexColor(value) ? value : "#2563eb";

  return (
    <ThemeFormField label={label} htmlFor={id}>
      <div className="flex items-center gap-3">
        <input
          id={`${id}-picker`}
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-xl border border-transparent bg-transparent p-0.5"
          style={{ borderColor: "var(--theme-border)" }}
          aria-label={`${label} color picker`}
        />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="theme-input min-w-0 flex-1 rounded-xl px-4 py-2.5 text-sm font-mono"
          placeholder="#2563eb"
          spellCheck={false}
        />
      </div>
    </ThemeFormField>
  );
}
