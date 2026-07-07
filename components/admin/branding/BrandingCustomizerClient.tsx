"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  CloudUpload,
  Loader2,
  Palette,
  Phone,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import ThemeColorField from "@/components/admin/branding/ThemeColorField";
import ThemeFormField from "@/components/admin/branding/ThemeFormField";
import ThemePreviewPanel from "@/components/admin/branding/ThemePreviewPanel";
import ThemeToggleSwitch from "@/components/admin/branding/ThemeToggleSwitch";
import AppHeader from "@/components/ui/layout/AppHeader";
import PageContainer from "@/components/ui/layout/PageContainer";
import { useTheme } from "@/components/theme/ThemeProvider";
import type { ThemeColors, ThemeFeatureFlags, ThemeSocialLink } from "@/lib/theme/types";

type BrandingTab = "branding" | "colors" | "contact" | "features";

const TABS: { id: BrandingTab; label: string; icon: typeof Sparkles }[] = [
  { id: "branding", label: "Branding & Assets", icon: Sparkles },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "contact", label: "Contact & Socials", icon: Share2 },
  { id: "features", label: "Features", icon: SlidersHorizontal },
];

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Muted text" },
  { key: "accent", label: "Accent" },
  { key: "border", label: "Border" },
];

const FEATURE_TOGGLES: {
  key: keyof ThemeFeatureFlags;
  label: string;
  description: string;
}[] = [
  { key: "showLive", label: "Live stream", description: "Show Live in navigation and dashboard." },
  { key: "showGiving", label: "Giving", description: "Enable the giving tab and quick action." },
  { key: "showBuySeeds", label: "Buy Seeds", description: "Show seed packs and wallet purchases." },
  { key: "showMusic", label: "Music", description: "Expose the music library tab." },
  { key: "showPrayer", label: "Contact & Prayer", description: "Show contact / prayer quick action." },
  { key: "showStory", label: "Featured story", description: "Display the hero story card on home." },
];

function slugifyLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "social-link";
}

export default function BrandingCustomizerClient() {
  const { theme, setTheme, resetTheme, hasCustomTheme, replaceTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<BrandingTab>("branding");
  const [apiStatus, setApiStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const updateColor = useCallback(
    (key: keyof ThemeColors, value: string) => {
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

  const addSocialLink = () => {
    const next: ThemeSocialLink = {
      id: `social-${Date.now()}`,
      label: "New link",
      href: "https://",
    };
    setTheme({ socialLinks: [...theme.socialLinks, next] });
  };

  const updateSocialLink = (index: number, patch: Partial<ThemeSocialLink>) => {
    const links = theme.socialLinks.map((link, i) => {
      if (i !== index) return link;
      const label = patch.label ?? link.label;
      return {
        ...link,
        ...patch,
        id: patch.label ? slugifyLabel(label) : link.id,
      };
    });
    setTheme({ socialLinks: links });
  };

  const removeSocialLink = (index: number) => {
    setTheme({ socialLinks: theme.socialLinks.filter((_, i) => i !== index) });
  };

  const syncToApi = async () => {
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
      setApiMessage("Theme synced to server store (in-memory until database wiring lands).");
      window.setTimeout(() => setApiStatus("idle"), 3000);
    } catch (error) {
      setApiStatus("error");
      setApiMessage(error instanceof Error ? error.message : "Failed to save theme");
    }
  };

  const loadFromApi = async () => {
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
    <div
      className="flex min-h-dvh w-full flex-col"
      style={{ background: "var(--theme-app-gradient)", color: "var(--theme-text)" }}
    >
      <AppHeader
        title="App Customizer"
        subtitle="Branding & layout configuration"
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/admin"
              className="theme-button-secondary rounded-xl px-3 py-2 text-xs font-semibold"
            >
              Admin home
            </Link>
            <Link
              href="/attendee-dashboard"
              className="theme-button-secondary rounded-xl px-3 py-2 text-xs font-semibold"
            >
              View app
            </Link>
            <button
              type="button"
              onClick={resetTheme}
              className="theme-button-secondary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset defaults
            </button>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <PageContainer maxWidth="lg" className="py-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              {hasCustomTheme
                ? "Custom theme active — saved locally in this browser."
                : "Using neutral default theme — customize any field to begin."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={syncToApi}
                disabled={apiStatus === "saving"}
                className="theme-button-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-60"
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
                className="theme-button-secondary rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-60"
              >
                Load from API
              </button>
            </div>
          </div>

          {apiMessage ? (
            <p
              className="mb-4 rounded-xl px-4 py-3 text-sm"
              style={{
                color: apiStatus === "error" ? "var(--theme-accent)" : "var(--theme-text)",
                backgroundColor: "color-mix(in srgb, var(--theme-surface) 90%, transparent)",
                border: "1px solid var(--theme-border)",
              }}
              role="status"
            >
              {apiMessage}
            </p>
          ) : null}

          <nav
            className="mb-6 flex flex-wrap gap-2"
            aria-label="Customizer sections"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                    active ? "theme-card--active" : "theme-card"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="theme-card space-y-5 rounded-2xl p-5 sm:p-6">
              {activeTab === "branding" ? (
                <>
                  <header>
                    <h2 className="text-lg font-semibold">Branding & assets</h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                      Identity fields shown across login, dashboard, and navigation.
                    </p>
                  </header>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ThemeFormField label="App name" htmlFor="theme-app-name">
                      <input
                        id="theme-app-name"
                        type="text"
                        value={theme.appName}
                        onChange={(e) => setTheme({ appName: e.target.value })}
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </ThemeFormField>
                    <ThemeFormField label="Tagline" htmlFor="theme-tagline">
                      <input
                        id="theme-tagline"
                        type="text"
                        value={theme.tagline}
                        onChange={(e) => setTheme({ tagline: e.target.value })}
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </ThemeFormField>
                    <ThemeFormField
                      label="Logo URL"
                      htmlFor="theme-logo-url"
                      hint="Absolute or public path, e.g. /tenant-default/logo.png"
                    >
                      <input
                        id="theme-logo-url"
                        type="url"
                        value={theme.logoUrl ?? ""}
                        onChange={(e) =>
                          setTheme({ logoUrl: e.target.value.trim() || null })
                        }
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                        placeholder="https://…"
                      />
                    </ThemeFormField>
                    <ThemeFormField label="Favicon URL" htmlFor="theme-favicon-url">
                      <input
                        id="theme-favicon-url"
                        type="url"
                        value={theme.faviconUrl ?? ""}
                        onChange={(e) =>
                          setTheme({ faviconUrl: e.target.value.trim() || null })
                        }
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                        placeholder="https://…"
                      />
                    </ThemeFormField>
                    <ThemeFormField
                      label="Hero image URL"
                      htmlFor="theme-hero-url"
                      hint="Optional dashboard hero banner image."
                    >
                      <input
                        id="theme-hero-url"
                        type="url"
                        value={theme.heroImageUrl ?? ""}
                        onChange={(e) =>
                          setTheme({ heroImageUrl: e.target.value.trim() || null })
                        }
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm sm:col-span-2"
                        placeholder="https://…"
                      />
                    </ThemeFormField>
                  </div>
                </>
              ) : null}

              {activeTab === "colors" ? (
                <>
                  <header>
                    <h2 className="text-lg font-semibold">Color customization</h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                      Maps directly to <code className="text-xs">--theme-*</code> CSS variables.
                    </p>
                  </header>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {COLOR_FIELDS.map((field) => (
                      <ThemeColorField
                        key={field.key}
                        id={`color-${field.key}`}
                        label={field.label}
                        value={theme.colors[field.key]}
                        onChange={(value) => updateColor(field.key, value)}
                      />
                    ))}
                  </div>
                </>
              ) : null}

              {activeTab === "contact" ? (
                <>
                  <header>
                    <h2 className="text-lg font-semibold">Contact & socials</h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                      Powers the contact form mailto target and social link rows.
                    </p>
                  </header>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ThemeFormField label="Contact email" htmlFor="theme-contact-email">
                      <input
                        id="theme-contact-email"
                        type="email"
                        value={theme.contact.email}
                        onChange={(e) =>
                          setTheme({ contact: { email: e.target.value } })
                        }
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </ThemeFormField>
                    <ThemeFormField label="Website" htmlFor="theme-contact-website">
                      <input
                        id="theme-contact-website"
                        type="url"
                        value={theme.contact.website}
                        onChange={(e) =>
                          setTheme({ contact: { website: e.target.value } })
                        }
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </ThemeFormField>
                    <ThemeFormField
                      label="Mail subject prefix"
                      htmlFor="theme-contact-subject"
                      hint="Used when the contact form subject field is empty."
                    >
                      <input
                        id="theme-contact-subject"
                        type="text"
                        value={theme.contact.mailSubjectPrefix}
                        onChange={(e) =>
                          setTheme({ contact: { mailSubjectPrefix: e.target.value } })
                        }
                        className="theme-input w-full rounded-xl px-4 py-3 text-sm sm:col-span-2"
                      />
                    </ThemeFormField>
                  </div>

                  <div className="border-t pt-5" style={{ borderColor: "var(--theme-border)" }}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Phone className="size-4" style={{ color: "var(--theme-primary)" }} />
                        <h3 className="text-sm font-semibold">Social links</h3>
                      </div>
                      <button
                        type="button"
                        onClick={addSocialLink}
                        className="theme-button-secondary rounded-xl px-3 py-2 text-xs font-semibold"
                      >
                        Add link
                      </button>
                    </div>
                    {theme.socialLinks.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                        No social links yet.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {theme.socialLinks.map((link, index) => (
                          <li
                            key={`${link.id}-${index}`}
                            className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_auto]"
                            style={{ borderColor: "var(--theme-border)" }}
                          >
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) =>
                                updateSocialLink(index, { label: e.target.value })
                              }
                              className="theme-input rounded-xl px-3 py-2 text-sm"
                              placeholder="Label"
                              aria-label={`Social link ${index + 1} label`}
                            />
                            <input
                              type="url"
                              value={link.href}
                              onChange={(e) =>
                                updateSocialLink(index, { href: e.target.value })
                              }
                              className="theme-input rounded-xl px-3 py-2 text-sm"
                              placeholder="https://"
                              aria-label={`Social link ${index + 1} URL`}
                            />
                            <button
                              type="button"
                              onClick={() => removeSocialLink(index)}
                              className="theme-button-secondary rounded-xl px-3 py-2 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : null}

              {activeTab === "features" ? (
                <>
                  <header>
                    <h2 className="text-lg font-semibold">Feature toggles</h2>
                    <p className="mt-1 text-sm" style={{ color: "var(--theme-text-muted)" }}>
                      Hide or show modules without redeploying code.
                    </p>
                  </header>
                  <div className="space-y-3">
                    {FEATURE_TOGGLES.map((toggle) => (
                      <ThemeToggleSwitch
                        key={toggle.key}
                        id={`feature-${toggle.key}`}
                        label={toggle.label}
                        description={toggle.description}
                        checked={theme.features[toggle.key]}
                        onChange={(checked) => updateFeature(toggle.key, checked)}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </section>

            <ThemePreviewPanel />
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
