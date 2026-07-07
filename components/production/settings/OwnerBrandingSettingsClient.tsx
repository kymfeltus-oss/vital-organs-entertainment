"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  CloudUpload,
  ImageIcon,
  Loader2,
  Lock,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import ThemePreviewPanel from "@/components/admin/branding/ThemePreviewPanel";
import OwnerProductionSideMenu from "@/components/owner/OwnerProductionSideMenu";
import BrandingAssetsSection from "@/components/production/settings/BrandingAssetsSection";
import BrandingColorsSection from "@/components/production/settings/BrandingColorsSection";
import BrandingFeaturesSection from "@/components/production/settings/BrandingFeaturesSection";
import BrandingIdentitySection from "@/components/production/settings/BrandingIdentitySection";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemeFeatureFlags } from "@/lib/theme/types";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";
import { cn } from "@/lib/utils";

type BrandingTab = "identity" | "assets" | "colors" | "features";

const TABS: { id: BrandingTab; label: string; icon: typeof Sparkles }[] = [
  { id: "identity", label: "Identity", icon: Sparkles },
  { id: "assets", label: "Assets", icon: ImageIcon },
  { id: "colors", label: "Color Palette", icon: Palette },
  { id: "features", label: "Feature Gates", icon: SlidersHorizontal },
];

export default function OwnerBrandingSettingsClient() {
  const {
    theme,
    setTheme,
    resetTheme,
    hasCustomTheme,
    isEnterpriseLocked,
    themeSource,
    replaceTheme,
  } = useTheme();
  const [activeTab, setActiveTab] = useState<BrandingTab>("identity");
  const [apiStatus, setApiStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const disabled = isEnterpriseLocked;

  const updateColor = useCallback(
    (key: keyof typeof theme.colors, value: string) => {
      setTheme({ colors: { [key]: value } });
    },
    [setTheme],
  );

  const updateFeature = useCallback(
    (key: keyof ThemeFeatureFlags, value: boolean) => {
      setTheme({ features: { [key]: value } });
    },
    [setTheme],
  );

  const syncToApi = async () => {
    if (disabled) return;
    setApiStatus("saving");
    setApiMessage(null);
    try {
      const response = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to save theme");
      }
      setApiStatus("saved");
      setApiMessage("Theme synced to server store.");
      window.setTimeout(() => setApiStatus("idle"), 3000);
    } catch (error) {
      setApiStatus("error");
      setApiMessage(error instanceof Error ? error.message : "Failed to save theme");
    }
  };

  const loadFromApi = async () => {
    if (disabled) return;
    setApiStatus("saving");
    setApiMessage(null);
    try {
      const response = await fetch("/api/admin/theme");
      if (!response.ok) throw new Error("Failed to load theme");
      const body = (await response.json()) as { theme: typeof theme };
      replaceTheme(body.theme);
      setApiStatus("saved");
      setApiMessage("Loaded theme from server store.");
      window.setTimeout(() => setApiStatus("idle"), 3000);
    } catch (error) {
      setApiStatus("error");
      setApiMessage(error instanceof Error ? error.message : "Failed to load theme");
    }
  };

  return (
    <div className="min-h-dvh bg-[#050814] text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 p-3 xl:flex-row xl:gap-5 xl:p-4">
        <OwnerProductionSideMenu active="branding" />

        <div className="min-w-0 flex-1">
          <header className="rounded-[6px] border border-white/10 bg-[linear-gradient(180deg,#090e12,#05080a)] px-4 py-4 shadow-[0_0_28px_rgba(0,168,255,0.08)]">
            <p className="font-ui text-[0.54rem] font-black uppercase tracking-[0.16em] text-[#00a8ff]">
              Production / Settings
            </p>
            <h1 className="mt-1 font-headline text-2xl uppercase leading-none text-white">
              Branding & Layout
            </h1>
            <p className="mt-2 max-w-2xl font-body text-sm text-white/65">
              Configure {PLATFORM_APP_NAME} identity, assets, palette tokens, and feature gates.
              Changes preview instantly via global theme context.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href="/owner/cockpit"
                className="rounded-md border border-white/15 bg-black/30 px-3 py-2 font-ui text-[0.62rem] font-black uppercase tracking-[0.1em] text-white/80 hover:border-[#00a8ff]/40 hover:text-white"
              >
                Back to cockpit
              </Link>
              <Link
                href="/attendee-dashboard"
                className="rounded-md border border-white/15 bg-black/30 px-3 py-2 font-ui text-[0.62rem] font-black uppercase tracking-[0.1em] text-white/80 hover:border-[#00a8ff]/40 hover:text-white"
              >
                Preview attendee app
              </Link>
              {!disabled ? (
                <>
                  <button
                    type="button"
                    onClick={resetTheme}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/30 px-3 py-2 font-ui text-[0.62rem] font-black uppercase tracking-[0.1em] text-white/80 hover:border-[#00a8ff]/40"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Reset defaults
                  </button>
                  <button
                    type="button"
                    onClick={syncToApi}
                    disabled={apiStatus === "saving"}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#00a8ff]/45 bg-[#00a8ff]/15 px-3 py-2 font-ui text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#00a8ff] disabled:opacity-60"
                  >
                    {apiStatus === "saving" ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <CloudUpload className="size-3.5" aria-hidden="true" />
                    )}
                    Sync to API
                  </button>
                  <button
                    type="button"
                    onClick={loadFromApi}
                    disabled={apiStatus === "saving"}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-black/30 px-3 py-2 font-ui text-[0.62rem] font-black uppercase tracking-[0.1em] text-white/80 disabled:opacity-60"
                  >
                    Load from API
                  </button>
                </>
              ) : null}
            </div>

            {isEnterpriseLocked ? (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300/35 bg-amber-300/10 px-3 py-2.5">
                <Lock className="mt-0.5 size-4 shrink-0 text-amber-200" aria-hidden="true" />
                <p className="font-body text-xs leading-relaxed text-amber-100/90">
                  Enterprise profile override is active ({themeSource}). Dashboard configurations are
                  read-only — the hardcoded workspace theme file takes precedence.
                </p>
              </div>
            ) : (
              <p className="mt-3 font-body text-xs text-white/50">
                {hasCustomTheme
                  ? "Custom theme active — saved locally in this browser."
                  : "Using default-theme.ts fallbacks — edit any field to begin."}
              </p>
            )}

            {apiMessage ? (
              <p
                className={cn(
                  "mt-2 font-body text-xs",
                  apiStatus === "error" ? "text-red-300" : "text-lime-300",
                )}
              >
                {apiMessage}
              </p>
            ) : null}
          </header>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <section className="rounded-[6px] border border-white/10 bg-[linear-gradient(180deg,#090e12,#05080a)] p-4">
              <nav
                className="mb-5 flex flex-wrap gap-2 border-b border-white/10 pb-4"
                aria-label="Branding settings sections"
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-md border px-3 py-2 font-ui text-[0.62rem] font-black uppercase tracking-[0.08em] transition",
                        active
                          ? "border-[#00a8ff]/55 bg-[#00a8ff]/12 text-white"
                          : "border-white/10 bg-black/20 text-white/60 hover:border-[#00a8ff]/35 hover:text-white",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>

              <div className={disabled ? "pointer-events-none opacity-70" : undefined}>
                {activeTab === "identity" ? (
                  <BrandingIdentitySection
                    appName={theme.appName}
                    tagline={theme.tagline}
                    disabled={disabled}
                    onChange={(patch) => setTheme(patch)}
                  />
                ) : null}
                {activeTab === "assets" ? (
                  <BrandingAssetsSection
                    logoUrl={theme.logoUrl}
                    faviconUrl={theme.faviconUrl}
                    disabled={disabled}
                    onChange={(patch) => setTheme(patch)}
                  />
                ) : null}
                {activeTab === "colors" ? (
                  <BrandingColorsSection
                    colors={theme.colors}
                    disabled={disabled}
                    onColorChange={updateColor}
                  />
                ) : null}
                {activeTab === "features" ? (
                  <BrandingFeaturesSection
                    features={theme.features}
                    disabled={disabled}
                    onFeatureChange={updateFeature}
                  />
                ) : null}
              </div>
            </section>

            <ThemePreviewPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
