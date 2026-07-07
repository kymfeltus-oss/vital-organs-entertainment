"use client";

import { ExternalLink, HeartHandshake, Music2, Radio, Sprout } from "lucide-react";
import BrandLogo from "@/components/ui/layout/BrandLogo";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemePreviewPanel() {
  const { theme } = useTheme();

  const enabledFeatures = [
    theme.features.showLive ? "Live" : null,
    theme.features.showGiving ? "Giving" : null,
    theme.features.showMusic ? "Music" : null,
    theme.features.showBuySeeds ? "Buy Seeds" : null,
    theme.features.showPrayer ? "Contact" : null,
  ].filter((entry): entry is string => entry !== null);

  return (
    <aside
      className="theme-card sticky top-6 space-y-5 rounded-2xl p-5"
      aria-label="Live theme preview"
    >
      <div>
        <p className="theme-label mb-2">Live preview</p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
          Changes apply instantly across the app.
        </p>
      </div>

      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: "var(--theme-border)",
          background: "var(--theme-app-gradient)",
        }}
      >
        <div className="flex justify-center">
          <BrandLogo size="md" />
        </div>
        <h3
          className="mt-4 text-center text-lg font-semibold"
          style={{ fontFamily: "var(--theme-font-headline)", color: "var(--theme-text)" }}
        >
          {theme.appName}
        </h3>
        <p className="mt-1 text-center text-sm" style={{ color: "var(--theme-text-muted)" }}>
          {theme.tagline}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {theme.features.showMusic ? (
            <PreviewChip icon={Music2} label="Music" />
          ) : null}
          {theme.features.showLive ? (
            <PreviewChip icon={Radio} label="Live" />
          ) : null}
          {theme.features.showGiving ? (
            <PreviewChip icon={HeartHandshake} label="Giving" />
          ) : null}
          {theme.features.showBuySeeds ? (
            <PreviewChip icon={Sprout} label="Seeds" />
          ) : null}
        </div>

        <button
          type="button"
          className="theme-button-primary mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          Sample action
        </button>
      </div>

      <div>
        <p className="theme-label mb-2">Palette</p>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              ["Primary", theme.colors.primary],
              ["Surface", theme.colors.surface],
              ["Text", theme.colors.text],
              ["Accent", theme.colors.accent],
            ] as const
          ).map(([name, color]) => (
            <div key={name} className="text-center">
              <div
                className="mx-auto size-10 rounded-xl border"
                style={{ backgroundColor: color, borderColor: "var(--theme-border)" }}
                title={color}
              />
              <p className="mt-1 text-[0.65rem] font-medium" style={{ color: "var(--theme-text-muted)" }}>
                {name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 text-xs" style={{ color: "var(--theme-text-muted)" }}>
        <p>
          <span className="font-semibold" style={{ color: "var(--theme-text)" }}>
            Contact:
          </span>{" "}
          {theme.contact.email}
        </p>
        <p>
          <span className="font-semibold" style={{ color: "var(--theme-text)" }}>
            Features on:
          </span>{" "}
          {enabledFeatures.length > 0 ? enabledFeatures.join(", ") : "None"}
        </p>
        {theme.socialLinks.length > 0 ? (
          <ul className="space-y-1">
            {theme.socialLinks.map((link) => (
              <li key={link.id} className="flex items-center gap-1.5">
                <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                {link.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  );
}

function PreviewChip({
  icon: Icon,
  label,
}: {
  icon: typeof Music2;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium"
      style={{
        backgroundColor: "color-mix(in srgb, var(--theme-primary) 12%, transparent)",
        color: "var(--theme-text)",
      }}
    >
      <Icon className="size-3.5" style={{ color: "var(--theme-primary)" }} aria-hidden="true" />
      {label}
    </div>
  );
}
