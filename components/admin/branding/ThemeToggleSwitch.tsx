"use client";

type ThemeToggleSwitchProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function ThemeToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
}: ThemeToggleSwitchProps) {
  return (
    <div
      className="theme-card flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5"
      style={{ borderColor: "var(--theme-border)" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition"
        style={{
          backgroundColor: checked
            ? "var(--theme-primary)"
            : "color-mix(in srgb, var(--theme-text-muted) 35%, transparent)",
        }}
      >
        <span
          className="inline-block size-5 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(1.35rem)" : "translateX(0.2rem)" }}
        />
      </button>
    </div>
  );
}
