"use client";

import { useState, useEffect, useCallback } from "react";
import type { TenantBrandingConfig } from "@/lib/admin/tenant-branding-config";
import { isValidTenantId, sanitizeTenantIdInput } from "@/lib/onboarding/tenant-id";
import { resolveClientTenantId, persistDevTenantSlug } from "@/lib/theme/resolve-tenant-context";
import { clearVocabularyCache } from "@/hooks/vocabulary-cache";
import EngagementOverviewPanel from "@/components/admin/faith/EngagementOverviewPanel";
import LiturgicalColorPicker from "@/components/admin/faith/LiturgicalColorPicker";

const DEFAULT_GIVING = "Your Generosity";
const DEFAULT_TOKEN = "Faith Seeds";
const DEFAULT_EVENTS = "Community Gatherings";
const DEFAULT_MEMBERS = "Family Members";

export default function MinistryBrandingConsole() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlugInput, setTenantSlugInput] = useState("");
  const [needsConnect, setNeedsConnect] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [ministryName, setMinistryName] = useState("");
  const [customGivingName, setCustomGivingName] = useState(DEFAULT_GIVING);
  const [customTokenName, setCustomTokenName] = useState(DEFAULT_TOKEN);
  const [customEventsName, setCustomEventsName] = useState(DEFAULT_EVENTS);
  const [customMembersName, setCustomMembersName] = useState(DEFAULT_MEMBERS);
  const [primaryColor, setPrimaryColor] = useState("#FFB800");
  const [secondaryColor, setSecondaryColor] = useState("#7A00FF");
  const [tagline, setTagline] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyConfig = useCallback((config: TenantBrandingConfig) => {
    setMinistryName(config.ministryName);
    setCustomGivingName(config.customGivingName || DEFAULT_GIVING);
    setCustomTokenName(config.customTokenName || DEFAULT_TOKEN);
    setCustomEventsName(config.customEventsName || DEFAULT_EVENTS);
    setCustomMembersName(config.customMembersName || DEFAULT_MEMBERS);
    setPrimaryColor(config.primaryColor || "#FFB800");
    setSecondaryColor(config.secondaryColor || "#7A00FF");
    setTagline(config.tagline || "");
  }, []);

  const loadTenantConfiguration = useCallback(
    async (slug: string) => {
      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        const response = await fetch(`/api/admin/branding?tenantId=${encodeURIComponent(slug)}`);
        const body = (await response.json().catch(() => null)) as {
          config?: TenantBrandingConfig;
          error?: string;
        } | null;

        if (!response.ok) {
          throw new Error(body?.error ?? "Unable to load tenant configuration.");
        }

        persistDevTenantSlug(slug);
        setTenantId(slug);
        setNeedsConnect(false);

        if (body?.config) {
          applyConfig(body.config);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load sovereign architecture variables.",
        );
      } finally {
        setLoading(false);
        setConnecting(false);
      }
    },
    [applyConfig],
  );

  useEffect(() => {
    const slug = resolveClientTenantId();
    if (!slug) {
      setNeedsConnect(true);
      setLoading(false);
      return;
    }

    void loadTenantConfiguration(slug);
  }, [loadTenantConfiguration]);

  const handleConnectTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = sanitizeTenantIdInput(tenantSlugInput);

    if (!isValidTenantId(slug)) {
      setError("Enter a valid ministry subdomain slug (3–32 characters, letters, numbers, hyphens).");
      return;
    }

    setConnecting(true);
    setError(null);
    await loadTenantConfiguration(slug);
  };

  const handleConfigurationSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          ministryName,
          customGivingName,
          customTokenName,
          customEventsName,
          customMembersName,
          primaryColor,
          secondaryColor,
          tagline,
          accentGlow: `${primaryColor}80`,
        }),
      });

      const body = (await response.json().catch(() => null)) as {
        config?: TenantBrandingConfig;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Unable to secure configuration variables.");
      }

      if (body?.config) {
        applyConfig(body.config);
      }

      clearVocabularyCache(tenantId);
      setSuccess(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Network timeout. Unable to secure configuration variables.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0b0b0b] p-8 font-mono text-xs tracking-widest text-neutral-500">
        LOADING SOVEREIGN ARCHITECTURE VARIABLES...
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0b0b0b] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-neutral-900 pb-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#FFB800]">
            04 // Private Ministry Control OS
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            White-Label Language Dictionary
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-400">
            Customize the language used across your organization&apos;s experience. Every save writes
            directly to your isolated <code className="text-neutral-500">tenant_themes</code> row and
            propagates across web and mobile containers.
          </p>
          {tenantId ? (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-neutral-600">
              Tenant node: <span className="text-[#FFB800]">{tenantId}</span>
            </p>
          ) : null}
        </header>

        {needsConnect ? (
          <div className="mb-8 space-y-4 rounded-2xl border border-[#FFB800]/20 bg-neutral-950 p-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#FFB800]">
              Connect Ministry Node
            </h2>
            <p className="text-[11px] leading-relaxed text-neutral-500">
              Enter your onboarding subdomain slug, use{" "}
              <code className="text-neutral-400">?tenantId=your-slug</code>, or open{" "}
              <code className="text-neutral-400">your-slug.localhost:3000</code>.
            </p>
            <form onSubmit={handleConnectTenant} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={tenantSlugInput}
                  onChange={(e) => setTenantSlugInput(sanitizeTenantIdInput(e.target.value))}
                  placeholder="e.g., alpha, gracechurch"
                  className="w-full rounded-xl border border-neutral-900 bg-black px-4 py-3 font-mono text-xs text-white focus:border-[#FFB800] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={connecting}
                className="h-11 rounded-xl bg-[#FFB800] px-5 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-[#e6a600] disabled:opacity-40"
              >
                {connecting ? "Connecting..." : "Connect Node"}
              </button>
            </form>
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 rounded-xl border border-[#FFB800]/20 bg-amber-950/40 p-4 font-mono text-xs text-[#FFB800]">
            Theme specifications committed. Platform re-naming array is live.
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-6 rounded-xl border border-red-900/40 bg-red-950/30 p-4 font-mono text-xs text-red-300"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {!needsConnect ? (
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <form onSubmit={handleConfigurationSave} className="min-w-0 flex-1 space-y-6">
              <section className="space-y-5 rounded-2xl border border-neutral-900 bg-neutral-950 p-6">
                <div>
                  <h2 className="text-sm font-semibold text-white">Portal Terminology</h2>
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Rename built-in feature packages to match your local church culture.
                  </p>
                </div>

                <div className="space-y-4">
                  <Field
                    label='Rename "Giving Portal"'
                    value={customGivingName}
                    onChange={setCustomGivingName}
                    active
                  />
                  <Field
                    label='Rename "Events"'
                    value={customEventsName}
                    onChange={setCustomEventsName}
                  />
                  <Field
                    label='Rename "Members"'
                    value={customMembersName}
                    onChange={setCustomMembersName}
                  />
                  <Field
                    label='Rename "Faith Seeds" Tokens'
                    value={customTokenName}
                    onChange={setCustomTokenName}
                    hint="Updates in-stream gifting text and chat announcements."
                  />
                </div>
              </section>

              <section className="space-y-5 rounded-2xl border border-neutral-900 bg-neutral-950 p-6">
                <h2 className="text-sm font-semibold text-white">Brand Accent</h2>
                <LiturgicalColorPicker value={primaryColor} onChange={setPrimaryColor} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ministry / Church Name" value={ministryName} onChange={setMinistryName} />
                  <Field label="Mission Tagline" value={tagline} onChange={setTagline} />
                </div>
                <LiturgicalColorPicker
                  label="Secondary Glow Ambient"
                  value={secondaryColor}
                  onChange={setSecondaryColor}
                />
              </section>

              <button
                type="submit"
                disabled={saving || !tenantId}
                className="h-12 w-full rounded-xl bg-white text-xs font-bold uppercase tracking-widest text-black transition hover:bg-neutral-200 disabled:opacity-40"
              >
                {saving ? "Compiling Brand Arrays..." : "Save Configuration"}
              </button>
            </form>

            <EngagementOverviewPanel primaryColor={primaryColor} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  active = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  active?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-mono uppercase tracking-widest text-neutral-400">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={`w-full rounded-xl border bg-black px-4 py-3 text-sm text-white transition focus:outline-none ${
          active
            ? "border-[#FFB800] ring-1 ring-[#FFB800]/30"
            : "border-neutral-900 focus:border-[#FFB800]"
        }`}
      />
      {hint ? <p className="mt-1.5 text-[10px] text-neutral-600">{hint}</p> : null}
    </div>
  );
}
