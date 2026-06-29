"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeIcon,
  BookOpen,
  HeartHandshake,
  Loader2,
  Lock,
  MonitorPlay,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Square,
  Ticket,
} from "lucide-react";
import {
  formatGraphicsTypeLabel,
  getGraphicsTypeHelp,
  GRAPHICS_PRESET_TYPES,
  GraphicsPlacementAnchor,
  GraphicsPresetType,
  OwnerGraphicsPreset,
  OwnerGraphicsTheme,
  OWNER_GRAPHICS_DEFAULT_THEME,
} from "@/lib/owner/graphics-data-plane";

const TYPE_ICONS: Record<GraphicsPresetType, typeof BadgeIcon> = {
  LOWER_THIRD: BadgeIcon,
  OFFERING: HeartHandshake,
  SCRIPTURE: BookOpen,
  SLATE: Square,
  TICKER: Ticket,
};

const DEFAULT_FORM = {
  primary: "PASTOR IAN CRAIG",
  secondary: "LEAD PASTOR",
  durationMode: "manual",
  customDuration: 45,
};

type DurationMode = "manual" | "15" | "30" | "custom";

type ApiPresetResponse = {
  success: boolean;
  presets?: OwnerGraphicsPreset[];
  preset?: OwnerGraphicsPreset;
  error?: string;
};

type ApiThemeResponse = {
  success: boolean;
  theme?: OwnerGraphicsTheme;
  error?: string;
};

function compactId(id: string, index: number) {
  return `#${String(index + 1).padStart(3, "0")} · ${id.slice(0, 8)}`;
}

function getDurationSeconds(mode: DurationMode, customDuration: number) {
  if (mode === "15") return 15;
  if (mode === "30") return 30;
  if (mode === "custom") return Math.max(1, Math.min(3600, Math.trunc(customDuration || 1)));
  return 0;
}

function previewAccent(type: GraphicsPresetType) {
  if (type === "OFFERING") return "from-lime-300 via-emerald-400 to-cyan-300";
  if (type === "SCRIPTURE") return "from-amber-300 via-yellow-400 to-orange-400";
  if (type === "SLATE") return "from-violet-300 via-purple-500 to-fuchsia-400";
  if (type === "TICKER") return "from-yellow-300 via-orange-400 to-rose-400";
  return "from-[#0984ff] via-[#6c49ff] to-[#ff3fae]";
}

function sortPresets(presets: OwnerGraphicsPreset[]) {
  return [...presets].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export default function GraphicsSuitePrepClient() {
  const [selectedType, setSelectedType] = useState<GraphicsPresetType>("LOWER_THIRD");
  const [primary, setPrimary] = useState(DEFAULT_FORM.primary);
  const [secondary, setSecondary] = useState(DEFAULT_FORM.secondary);
  const [durationMode, setDurationMode] = useState<DurationMode>("manual");
  const [customDuration, setCustomDuration] = useState(DEFAULT_FORM.customDuration);
  const [presets, setPresets] = useState<OwnerGraphicsPreset[]>([]);
  const [theme, setTheme] = useState<OwnerGraphicsTheme | null>(null);
  const [themeDraft, setThemeDraft] = useState({
    cornerRadiusPx: OWNER_GRAPHICS_DEFAULT_THEME.corner_radius_px,
    paddingPx: OWNER_GRAPHICS_DEFAULT_THEME.padding_px,
    backgroundOpacityPercent: OWNER_GRAPHICS_DEFAULT_THEME.background_opacity_percent,
    placementAnchor: OWNER_GRAPHICS_DEFAULT_THEME.placement_anchor as GraphicsPlacementAnchor,
    customLogoUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedHelp = useMemo(() => getGraphicsTypeHelp(selectedType), [selectedType]);
  const activeDurationSeconds = getDurationSeconds(durationMode, customDuration);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [presetsResponse, themeResponse] = await Promise.all([
        fetch("/api/owner/graphics/presets", { cache: "no-store" }),
        fetch("/api/owner/graphics/theme", { cache: "no-store" }),
      ]);

      const presetsJson = (await presetsResponse.json()) as ApiPresetResponse;
      const themeJson = (await themeResponse.json()) as ApiThemeResponse;

      if (!presetsResponse.ok || !presetsJson.success) {
        throw new Error(presetsJson.error || "Unable to load saved graphics presets.");
      }

      if (!themeResponse.ok || !themeJson.success || !themeJson.theme) {
        throw new Error(themeJson.error || "Unable to load system theme defaults.");
      }

      setPresets(sortPresets(presetsJson.presets ?? []));
      setTheme(themeJson.theme);
      setThemeDraft({
        cornerRadiusPx: themeJson.theme.corner_radius_px,
        paddingPx: themeJson.theme.padding_px,
        backgroundOpacityPercent: themeJson.theme.background_opacity_percent,
        placementAnchor: themeJson.theme.placement_anchor,
        customLogoUrl: themeJson.theme.custom_logo_url ?? "",
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Graphics workspace failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  function handleTypeSelect(type: GraphicsPresetType) {
    const nextHelp = getGraphicsTypeHelp(type);
    setSelectedType(type);
    setPrimary(nextHelp.placeholderPrimary);
    setSecondary(nextHelp.placeholderSecondary);
    setSuccess(null);
    setError(null);
  }

  async function handleSavePreset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/owner/graphics/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          contentPrimary: primary,
          contentSecondary: secondary,
          durationSeconds: activeDurationSeconds,
        }),
      });

      const json = (await response.json()) as ApiPresetResponse;
      if (!response.ok || !json.success || !json.preset) {
        throw new Error(json.error || "Unable to save graphic.");
      }

      setPresets((current) => sortPresets([json.preset as OwnerGraphicsPreset, ...current]));
      setSuccess(`${formatGraphicsTypeLabel(selectedType)} saved to the Production Cockpit.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save graphic.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTheme() {
    setThemeSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/owner/graphics/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(themeDraft),
      });

      const json = (await response.json()) as ApiThemeResponse;
      if (!response.ok || !json.success || !json.theme) {
        throw new Error(json.error || "Unable to save system theme defaults.");
      }

      setTheme(json.theme);
      setSuccess("System theme defaults updated.");
    } catch (themeError) {
      setError(themeError instanceof Error ? themeError.message : "Unable to save theme defaults.");
    } finally {
      setThemeSaving(false);
    }
  }

  async function handleResetTheme() {
    setThemeSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/owner/graphics/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      const json = (await response.json()) as ApiThemeResponse;
      if (!response.ok || !json.success || !json.theme) {
        throw new Error(json.error || "Unable to reset system theme defaults.");
      }

      setTheme(json.theme);
      setThemeDraft({
        cornerRadiusPx: json.theme.corner_radius_px,
        paddingPx: json.theme.padding_px,
        backgroundOpacityPercent: json.theme.background_opacity_percent,
        placementAnchor: json.theme.placement_anchor,
        customLogoUrl: json.theme.custom_logo_url ?? "",
      });
      setSuccess("System theme defaults reset to app defaults.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset theme defaults.");
    } finally {
      setThemeSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-[#1b3c7a]/70 bg-[#020611]/95 p-4 shadow-[0_0_36px_rgba(0,97,255,0.14)] sm:p-5">
        <div className="mb-5 text-center">
          <p className="font-ui text-[0.65rem] uppercase tracking-[0.35em] text-[#7aa7ff]">
            Create · Style · Save · Build your master catalog
          </p>
          <h2 className="mt-1 font-headline text-2xl uppercase tracking-[0.08em] text-white">
            Page 1: Graphics Suite <span className="text-[#6d6dff]">(Build & Prepare)</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#00DDEB]" />
            Loading synchronized graphics workspace…
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <form onSubmit={handleSavePreset} className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="mb-3 font-ui text-xs uppercase tracking-[0.16em] text-white/80">
                  1. Choose Graphic Type
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:grid-cols-2 2xl:grid-cols-5">
                  {GRAPHICS_PRESET_TYPES.map((type) => {
                    const Icon = TYPE_ICONS[type];
                    const isSelected = selectedType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeSelect(type)}
                        className={`rounded-xl border p-3 text-center transition ${
                          isSelected
                            ? "border-[#1687ff] bg-[#073a85]/60 shadow-[0_0_18px_rgba(0,132,255,0.35)]"
                            : "border-white/10 bg-white/[0.03] hover:border-[#1687ff]/50"
                        }`}
                      >
                        <Icon
                          className={`mx-auto mb-2 h-6 w-6 ${
                            isSelected ? "text-[#18a0ff]" : "text-white/65"
                          }`}
                        />
                        <span className="font-ui text-[0.62rem] uppercase tracking-[0.08em] text-white">
                          {formatGraphicsTypeLabel(type)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="mb-3 font-ui text-xs uppercase tracking-[0.16em] text-white/80">
                  2. Content
                </p>
                <label className="block">
                  <span className="flex items-center justify-between font-ui text-[0.68rem] uppercase text-white/65">
                    {selectedHelp.primary}
                    <span>{primary.length}/180</span>
                  </span>
                  <input
                    value={primary}
                    onChange={(event) => setPrimary(event.target.value)}
                    placeholder={selectedHelp.placeholderPrimary}
                    maxLength={180}
                    className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-[#07101f] px-3 font-ui text-sm text-white outline-none focus:border-[#1687ff]"
                    required
                  />
                </label>
                <label className="mt-3 block">
                  <span className="flex items-center justify-between font-ui text-[0.68rem] uppercase text-white/65">
                    {selectedHelp.secondary}
                    <span>{secondary.length}/260</span>
                  </span>
                  <textarea
                    value={secondary}
                    onChange={(event) => setSecondary(event.target.value)}
                    placeholder={selectedHelp.placeholderSecondary}
                    maxLength={260}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-[#07101f] px-3 py-2 font-ui text-sm text-white outline-none focus:border-[#1687ff]"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="mb-3 font-ui text-xs uppercase tracking-[0.16em] text-white/80">
                  3. Duration Timer
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["manual", "Manual"],
                    ["15", "15s"],
                    ["30", "30s"],
                    ["custom", "Custom"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDurationMode(value as DurationMode)}
                      className={`min-h-10 rounded-lg border font-ui text-xs uppercase tracking-[0.12em] ${
                        durationMode === value
                          ? "border-[#00DDEB] bg-[#00DDEB]/15 text-[#9df8ff]"
                          : "border-white/10 bg-white/[0.03] text-white/65"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {durationMode === "custom" ? (
                  <label className="mt-3 block">
                    <span className="font-ui text-[0.68rem] uppercase text-white/65">
                      Custom seconds
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={3600}
                      value={customDuration}
                      onChange={(event) => setCustomDuration(Number.parseInt(event.target.value, 10) || 1)}
                      className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-[#07101f] px-3 font-ui text-sm text-white outline-none focus:border-[#1687ff]"
                    />
                  </label>
                ) : null}
              </div>

              <details className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-ui text-xs uppercase tracking-[0.14em] text-white/80">
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#b682ff]" />
                    Edit System Theme Defaults
                  </span>
                  <Lock className="h-4 w-4 text-white/45" />
                </summary>
                <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                  <label className="block">
                    <span className="flex justify-between font-ui text-[0.68rem] uppercase text-white/65">
                      Background Opacity <span>{themeDraft.backgroundOpacityPercent}%</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={themeDraft.backgroundOpacityPercent}
                      onChange={(event) =>
                        setThemeDraft((current) => ({
                          ...current,
                          backgroundOpacityPercent: Number.parseInt(event.target.value, 10),
                        }))
                      }
                      className="mt-2 w-full accent-[#b682ff]"
                    />
                  </label>
                  <label className="block">
                    <span className="flex justify-between font-ui text-[0.68rem] uppercase text-white/65">
                      Padding <span>{themeDraft.paddingPx}px</span>
                    </span>
                    <input
                      type="range"
                      min={4}
                      max={64}
                      value={themeDraft.paddingPx}
                      onChange={(event) =>
                        setThemeDraft((current) => ({
                          ...current,
                          paddingPx: Number.parseInt(event.target.value, 10),
                        }))
                      }
                      className="mt-2 w-full accent-[#1687ff]"
                    />
                  </label>
                  <label className="block">
                    <span className="flex justify-between font-ui text-[0.68rem] uppercase text-white/65">
                      Corner Radius <span>{themeDraft.cornerRadiusPx}px</span>
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={themeDraft.cornerRadiusPx}
                      onChange={(event) =>
                        setThemeDraft((current) => ({
                          ...current,
                          cornerRadiusPx: Number.parseInt(event.target.value, 10),
                        }))
                      }
                      className="mt-2 w-full accent-[#ff3fae]"
                    />
                  </label>
                  <label className="block">
                    <span className="font-ui text-[0.68rem] uppercase text-white/65">
                      Placement Anchor
                    </span>
                    <select
                      value={themeDraft.placementAnchor}
                      onChange={(event) =>
                        setThemeDraft((current) => ({
                          ...current,
                          placementAnchor: event.target.value as GraphicsPlacementAnchor,
                        }))
                      }
                      className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-[#07101f] px-3 font-ui text-sm text-white outline-none focus:border-[#1687ff]"
                    >
                      <option value="BOTTOM_LEFT">Bottom Left</option>
                      <option value="BOTTOM_RIGHT">Bottom Right</option>
                      <option value="TOP_LEFT">Top Left</option>
                      <option value="TOP_RIGHT">Top Right</option>
                      <option value="CENTER">Center</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="font-ui text-[0.68rem] uppercase text-white/65">
                      Optional Custom Logo URL
                    </span>
                    <input
                      value={themeDraft.customLogoUrl}
                      onChange={(event) =>
                        setThemeDraft((current) => ({ ...current, customLogoUrl: event.target.value }))
                      }
                      placeholder="Leave blank to inherit app logo"
                      className="mt-2 min-h-11 w-full rounded-lg border border-white/10 bg-[#07101f] px-3 font-ui text-sm text-white outline-none focus:border-[#1687ff]"
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={handleResetTheme}
                      disabled={themeSaving}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] font-ui text-xs uppercase tracking-[0.14em] text-white/70 disabled:opacity-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset to App Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTheme}
                      disabled={themeSaving}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#28104d] font-ui text-xs uppercase tracking-[0.14em] text-[#ecdfff] disabled:opacity-50"
                    >
                      {themeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Theme Defaults
                    </button>
                  </div>
                </div>
              </details>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="mb-3 font-ui text-xs uppercase tracking-[0.16em] text-white/80">
                  4. Save to Catalog
                </p>
                <button
                  type="submit"
                  disabled={saving || !primary.trim()}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#096bff] font-ui text-sm uppercase tracking-[0.14em] text-white shadow-[0_0_22px_rgba(9,107,255,0.35)] transition hover:bg-[#1687ff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Graphic
                </button>
                <p className="mt-2 text-center font-body text-xs text-white/50">
                  Your graphic will appear in the Production Cockpit.
                </p>
              </div>
            </form>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="mb-3 font-ui text-xs uppercase tracking-[0.16em] text-white/80">
                  5. Preview <span className="text-white/45">(Title-safe applied)</span>
                </p>
                <div className="aspect-video rounded-xl border border-[#315ebd]/70 bg-[radial-gradient(circle_at_18%_18%,rgba(0,115,255,0.42),transparent_34%),radial-gradient(circle_at_82%_82%,rgba(255,40,174,0.34),transparent_38%),linear-gradient(135deg,#061022,#110727)] p-[5%] shadow-inner">
                  <div className="relative h-full w-full overflow-hidden rounded-lg bg-black/20">
                    <div className="absolute right-4 top-4 text-right font-headline text-2xl font-black leading-none text-[#5ca8ff]">
                      300
                      <span className="block font-ui text-[0.48rem] tracking-[0.16em] text-white">
                        AWAKENING
                      </span>
                    </div>
                    <div className="absolute bottom-[12%] left-[6%] right-[6%]">
                      {selectedType === "TICKER" ? (
                        <div className="overflow-hidden rounded-full border border-white/15 bg-black/70 px-5 py-3">
                          <p className={`bg-gradient-to-r ${previewAccent(selectedType)} bg-clip-text font-ui text-sm uppercase tracking-[0.18em] text-transparent`}>
                            {primary || selectedHelp.placeholderPrimary} · {secondary || selectedHelp.placeholderSecondary}
                          </p>
                        </div>
                      ) : (
                        <div
                          className="border border-white/15 bg-black/70"
                          style={{
                            borderRadius: themeDraft.cornerRadiusPx,
                            padding: themeDraft.paddingPx,
                            backgroundColor: `rgba(0,0,0,${themeDraft.backgroundOpacityPercent / 100})`,
                          }}
                        >
                          <div className={`mb-3 h-1.5 w-40 rounded-full bg-gradient-to-r ${previewAccent(selectedType)}`} />
                          <h3 className="font-headline text-3xl uppercase tracking-[0.08em] text-white">
                            {primary || selectedHelp.placeholderPrimary}
                          </h3>
                          <p className="mt-1 font-ui text-sm uppercase tracking-[0.16em] text-[#ff4eb7]">
                            {secondary || selectedHelp.placeholderSecondary}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-ui text-xs uppercase tracking-[0.16em] text-white/80">
                    Master Graphics Catalog
                  </p>
                  <span className="rounded-full border border-white/10 px-3 py-1 font-ui text-[0.62rem] uppercase text-white/50">
                    {presets.length} saved
                  </span>
                </div>
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {presets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 p-6 text-center font-body text-sm text-white/50">
                      No graphics saved yet. Build the first preset on the left.
                    </div>
                  ) : (
                    presets.map((preset, index) => (
                      <article
                        key={preset.id}
                        className="grid gap-3 rounded-xl border border-white/10 bg-[#06101f] p-3 sm:grid-cols-[0.8fr_1fr_2fr_0.8fr]"
                      >
                        <p className="font-ui text-[0.68rem] uppercase text-white/55">
                          {compactId(preset.id, index)}
                        </p>
                        <p className="font-ui text-[0.68rem] uppercase tracking-[0.1em] text-[#8eb6ff]">
                          {formatGraphicsTypeLabel(preset.type)}
                        </p>
                        <div>
                          <p className="font-ui text-xs uppercase text-white">{preset.content_primary}</p>
                          <p className="mt-1 line-clamp-1 font-body text-xs text-white/50">
                            {preset.content_secondary || "No secondary copy"}
                          </p>
                        </div>
                        <p className="font-ui text-[0.68rem] uppercase text-white/45">
                          {new Date(preset.created_at).toLocaleDateString()}
                          <span className="block text-[#00DDEB]/80">
                            {preset.duration_seconds > 0 ? `${preset.duration_seconds}s` : "Manual"}
                          </span>
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 font-body text-sm text-red-100">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 font-body text-sm text-emerald-100">
            {success}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-3xl border border-[#1b3c7a]/70 bg-[#020611] p-4 sm:grid-cols-3">
        {[
          ["Brand locked by default", "Colors, fonts, shapes, and logo inheritance stay synced to the app."],
          ["Title-safe hard lock", "A 5% inset is applied permanently so graphics do not get cut off."],
          ["Duration timers", "Manual, 15s, 30s, and custom durations are saved with every preset."],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <MonitorPlay className="mb-3 h-5 w-5 text-[#00DDEB]" />
            <p className="font-ui text-xs uppercase tracking-[0.14em] text-white">{title}</p>
            <p className="mt-2 font-body text-sm text-white/50">{copy}</p>
          </div>
        ))}
      </div>

      {theme ? (
        <p className="text-center font-ui text-[0.65rem] uppercase tracking-[0.18em] text-white/35">
          Theme synced: radius {theme.corner_radius_px}px · padding {theme.padding_px}px · opacity{" "}
          {theme.background_opacity_percent}% · {theme.placement_anchor.replace("_", " ")}
        </p>
      ) : null}
    </section>
  );
}
