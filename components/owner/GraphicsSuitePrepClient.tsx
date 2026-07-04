"use client";

import {
  type CSSProperties,
  type FormEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BadgeIcon,
  BookOpen,
  Film,
  GripVertical,
  HeartHandshake,
  ImageIcon,
  Loader2,
  Move,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Square,
  Ticket,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { BroadcastLowerThirdPreset } from "@/components/owner/BroadcastGraphicPresets";
import GraphicsMonetizationRemindersPanel from "@/components/owner/GraphicsMonetizationRemindersPanel";
import {
  decodeGraphicsPresetMetadata,
  defaultGraphicsMetadataForKind,
  formatGraphicsTypeLabel,
  getGraphicsTypeHelp,
  GRAPHICS_PRESET_TYPES,
  OWNER_GRAPHICS_DEFAULT_THEME,
  type GraphicLayoutMode,
  type GraphicPositionAnchor,
  type GraphicsBuilderKind,
  type GraphicsPlacementAnchor,
  type GraphicsPresetType,
  type OwnerGraphicsPreset,
  type OwnerGraphicsTheme,
} from "@/lib/owner/graphics-data-plane";

const BUILDER_KINDS = [...GRAPHICS_PRESET_TYPES, "SANCTUARY_VIDEO"] as const;
const TYPE_ICONS: Record<GraphicsBuilderKind, typeof BadgeIcon> = {
  LOWER_THIRD: BadgeIcon,
  OFFERING: HeartHandshake,
  SCRIPTURE: BookOpen,
  SLATE: Square,
  TICKER: Ticket,
  SANCTUARY_VIDEO: Film,
};

const LAYOUT_OPTIONS: Array<{ value: GraphicLayoutMode; label: string }> = [
  { value: "lower_third", label: "Lower Third" },
  { value: "fullscreen", label: "Full Screen" },
  { value: "partial", label: "Partial" },
  { value: "ticker", label: "Ticker" },
  { value: "corner_bug", label: "Corner Bug" },
  { value: "sanctuary_video", label: "Sanctuary Video" },
];

const POSITION_OPTIONS: Array<{ value: GraphicPositionAnchor; label: string }> = [
  { value: "TOP_LEFT", label: "Top left" },
  { value: "TOP_RIGHT", label: "Top right" },
  { value: "CENTER", label: "Center" },
  { value: "BOTTOM_LEFT", label: "Bottom left" },
  { value: "BOTTOM_RIGHT", label: "Bottom right" },
  { value: "FULLSCREEN", label: "Full screen" },
];

const UPLOAD_SLOTS = [
  { key: "logo", label: "Logo", accept: "image/png,image/jpeg,image/webp,image/svg+xml", target: "image", fallback: "/assets/logos/300-awakening-logo.png" },
  { key: "offering-logo", label: "Offering Logo", accept: "image/png,image/jpeg,image/webp,image/svg+xml", target: "image", fallback: "/owner-graphics/offering-logo-1782854413877.png" },
  { key: "custom-graphic", label: "Other Graphic", accept: "image/png,image/jpeg,image/webp,image/svg+xml", target: "image", fallback: "/effects/hero-audience-banner.png" },
  { key: "sanctuary-video", label: "Video", accept: "video/mp4,video/webm,video/quicktime", target: "video", fallback: null },
] as const;

type DurationMode = "manual" | "15" | "30" | "custom";
type ApiPresetResponse = { success: boolean; presets?: OwnerGraphicsPreset[]; preset?: OwnerGraphicsPreset; deletedId?: string; error?: string };
type ApiThemeResponse = { success: boolean; theme?: OwnerGraphicsTheme | null; error?: string };
type ApiAssetResponse = { success: boolean; asset?: { label: string; url: string }; error?: string };
type UploadedSlotAssets = Partial<Record<(typeof UPLOAD_SLOTS)[number]["key"], { label: string; url: string }>>;

const DEFAULT_FORM = { primary: "IAN CRAIG & 300", secondary: "LIVE IN CONCERT", customDuration: 10 };

function getDurationSeconds(mode: DurationMode, customDuration: number) {
  if (mode === "15") return 15;
  if (mode === "30") return 30;
  if (mode === "custom") return Math.max(1, Math.min(3600, Math.trunc(customDuration || 1)));
  return 0;
}

function builderLabel(kind: GraphicsBuilderKind) {
  return kind === "SANCTUARY_VIDEO" ? "Sanctuary Video" : formatGraphicsTypeLabel(kind as GraphicsPresetType);
}

function builderHelp(kind: GraphicsBuilderKind) {
  if (kind === "SANCTUARY_VIDEO") {
    return { primary: "Video title", secondary: "Production notes", placeholderPrimary: "SANCTUARY VIDEO", placeholderSecondary: "Program roll-in" };
  }
  return getGraphicsTypeHelp(kind);
}

function sortPresets(presets: OwnerGraphicsPreset[]) {
  return [...presets].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

function defaultTheme(): OwnerGraphicsTheme {
  return {
    id: "default-theme",
    event_id: OWNER_GRAPHICS_DEFAULT_THEME.event_id,
    corner_radius_px: OWNER_GRAPHICS_DEFAULT_THEME.corner_radius_px,
    padding_px: OWNER_GRAPHICS_DEFAULT_THEME.padding_px,
    background_opacity_percent: OWNER_GRAPHICS_DEFAULT_THEME.background_opacity_percent,
    placement_anchor: OWNER_GRAPHICS_DEFAULT_THEME.placement_anchor,
    custom_logo_url: OWNER_GRAPHICS_DEFAULT_THEME.custom_logo_url,
    updated_at: new Date(0).toISOString(),
  };
}

function placementStyle(layout: GraphicLayoutMode, anchor: GraphicPositionAnchor, x: number, y: number, width: number, height: number): CSSProperties {
  if (anchor === "FULLSCREEN" || layout === "fullscreen" || layout === "sanctuary_video") return { inset: "5%", width: "90%", height: "90%" };
  if (layout === "ticker") return { left: "4%", bottom: "6%", width: "92%", minHeight: "10%" };
  if (anchor === "CENTER") return { left: "50%", top: "50%", width: `${width}%`, minHeight: `${height}%`, transform: "translate(-50%, -50%)" };
  return { left: `${x}%`, top: `${y}%`, width: `${width}%`, minHeight: `${height}%` };
}

function catalogId(preset: OwnerGraphicsPreset, index: number) {
  const metadata = decodeGraphicsPresetMetadata(preset);
  const prefix = metadata.builderKind === "SANCTUARY_VIDEO" ? "VID" : preset.type === "LOWER_THIRD" ? "LT" : preset.type.slice(0, 3);
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function typeColor(kind: GraphicsBuilderKind) {
  if (kind === "OFFERING") return "border-[#ff2c9f]/60 text-[#ff4db2]";
  if (kind === "SCRIPTURE") return "border-purple-500/60 text-purple-400";
  if (kind === "TICKER") return "border-yellow-500/60 text-yellow-400";
  if (kind === "SANCTUARY_VIDEO") return "border-lime-500/60 text-lime-400";
  return "border-[#00bff8]/60 text-[#00bff8]";
}

export default function GraphicsSuitePrepClient() {
  const [selectedKind, setSelectedKind] = useState<GraphicsBuilderKind>("LOWER_THIRD");
  const [primary, setPrimary] = useState(DEFAULT_FORM.primary);
  const [secondary, setSecondary] = useState(DEFAULT_FORM.secondary);
  const [durationMode, setDurationMode] = useState<DurationMode>("manual");
  const [customDuration, setCustomDuration] = useState(DEFAULT_FORM.customDuration);
  const [layoutMode, setLayoutMode] = useState<GraphicLayoutMode>("lower_third");
  const [positionAnchor, setPositionAnchor] = useState<GraphicPositionAnchor>("BOTTOM_LEFT");
  const [xPercent, setXPercent] = useState(6);
  const [yPercent, setYPercent] = useState(72);
  const [widthPercent, setWidthPercent] = useState(72);
  const [heightPercent, setHeightPercent] = useState(20);
  const [zIndex, setZIndex] = useState(10);
  const [mediaUrl, setMediaUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("/assets/logos/300-awakening-logo.png");
  const [uploadedSlotAssets, setUploadedSlotAssets] = useState<UploadedSlotAssets>({});
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [presets, setPresets] = useState<OwnerGraphicsPreset[]>([]);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);
  const [theme, setTheme] = useState<OwnerGraphicsTheme>(() => defaultTheme());
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
  const previewSurfaceRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);

  const selectedHelp = useMemo(() => builderHelp(selectedKind), [selectedKind]);
  const durationSeconds = getDurationSeconds(durationMode, customDuration);
  const isVideo = selectedKind === "SANCTUARY_VIDEO" || layoutMode === "sanctuary_video";
  const previewBoxStyle = placementStyle(layoutMode, positionAnchor, xPercent, yPercent, widthPercent, heightPercent);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [presetResponse, themeResponse] = await Promise.all([
        fetch("/api/owner/graphics/presets", { cache: "no-store" }),
        fetch("/api/owner/graphics/theme", { cache: "no-store" }),
      ]);
      const presetJson = (await presetResponse.json()) as ApiPresetResponse;
      const themeJson = (await themeResponse.json()) as ApiThemeResponse;
      if (!presetResponse.ok || !presetJson.success) throw new Error(presetJson.error || "Unable to load saved graphics.");
      if (!themeResponse.ok || !themeJson.success) throw new Error(themeJson.error || "Unable to load the graphics theme.");
      const nextTheme = themeJson.theme ?? defaultTheme();
      setPresets(sortPresets(presetJson.presets ?? []));
      setTheme(nextTheme);
      setThemeDraft({
        cornerRadiusPx: nextTheme.corner_radius_px,
        paddingPx: nextTheme.padding_px,
        backgroundOpacityPercent: nextTheme.background_opacity_percent,
        placementAnchor: nextTheme.placement_anchor,
        customLogoUrl: nextTheme.custom_logo_url ?? "",
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

  function applyMetadataDefaults(kind: GraphicsBuilderKind) {
    const metadata = defaultGraphicsMetadataForKind(kind);
    setLayoutMode(metadata.layoutMode);
    setPositionAnchor(metadata.positionAnchor);
    setXPercent(metadata.xPercent);
    setYPercent(metadata.yPercent);
    setWidthPercent(metadata.widthPercent);
    setHeightPercent(metadata.heightPercent);
    setZIndex(metadata.zIndex);
    setMediaUrl("");
    setImageUrl(metadata.imageUrl ?? theme.custom_logo_url ?? "/assets/logos/300-awakening-logo.png");
  }

  function selectType(kind: GraphicsBuilderKind) {
    const help = builderHelp(kind);
    setSelectedKind(kind);
    setPrimary(help.placeholderPrimary);
    setSecondary(help.placeholderSecondary);
    setEditingPresetId(null);
    applyMetadataDefaults(kind);
    setError(null);
    setSuccess(null);
  }

  function editPreset(preset: OwnerGraphicsPreset) {
    const metadata = decodeGraphicsPresetMetadata(preset);
    setEditingPresetId(preset.id);
    setSelectedKind(metadata.builderKind);
    setPrimary(preset.content_primary);
    setSecondary(metadata.secondaryText ?? "");
    setLayoutMode(metadata.layoutMode);
    setPositionAnchor(metadata.positionAnchor);
    setXPercent(metadata.xPercent);
    setYPercent(metadata.yPercent);
    setWidthPercent(metadata.widthPercent);
    setHeightPercent(metadata.heightPercent);
    setZIndex(metadata.zIndex);
    setMediaUrl(metadata.mediaUrl ?? "");
    setImageUrl(metadata.imageUrl ?? "");
    setDurationMode(preset.duration_seconds ? "custom" : "manual");
    setCustomDuration(preset.duration_seconds || DEFAULT_FORM.customDuration);
    setSuccess(`Editing ${preset.content_primary}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingPresetId(null);
    setSelectedKind("LOWER_THIRD");
    setPrimary(DEFAULT_FORM.primary);
    setSecondary(DEFAULT_FORM.secondary);
    setDurationMode("manual");
    applyMetadataDefaults("LOWER_THIRD");
    setError(null);
    setSuccess(null);
  }

  async function uploadAsset(slot: string, file: File | null) {
    if (!file || uploadingSlot) return;
    setUploadingSlot(slot);
    setError(null);
    setSuccess(null);
    try {
      const body = new FormData();
      body.append("slot", slot);
      body.append("file", file);
      const response = await fetch("/api/owner/graphics/assets", { method: "POST", body });
      const json = (await response.json()) as ApiAssetResponse;
      if (!response.ok || !json.success || !json.asset) throw new Error(json.error || "Unable to upload the media asset.");
      const asset = { label: file.name, url: json.asset.url };
      setUploadedSlotAssets((current) => ({ ...current, [slot]: asset }));
      if (slot === "sanctuary-video") {
        setSelectedKind("SANCTUARY_VIDEO");
        setLayoutMode("sanctuary_video");
        setPositionAnchor("FULLSCREEN");
        setMediaUrl(asset.url);
      } else {
        setImageUrl(asset.url);
      }
      setSuccess(`${file.name} uploaded and selected.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload the media asset.");
    } finally {
      setUploadingSlot(null);
    }
  }

  async function savePreset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!primary.trim()) {
      setError("Primary text is required before saving the graphic.");
      return;
    }
    if (isVideo && !mediaUrl.trim()) {
      setError("Choose or enter a sanctuary video before saving.");
      return;
    }

    const wasEditing = Boolean(editingPresetId);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/owner/graphics/presets", {
        method: editingPresetId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPresetId,
          type: selectedKind,
          contentPrimary: primary,
          contentSecondary: secondary,
          durationSeconds,
          layoutMode,
          positionAnchor,
          xPercent,
          yPercent,
          widthPercent,
          heightPercent,
          zIndex,
          mediaUrl,
          imageUrl,
        }),
      });
      const json = (await response.json()) as ApiPresetResponse;
      if (!response.ok || !json.success || !json.preset) throw new Error(json.error || "Unable to save the graphic.");
      setPresets((current) => wasEditing
        ? sortPresets(current.map((item) => item.id === json.preset!.id ? json.preset! : item))
        : sortPresets([json.preset!, ...current]));
      if (wasEditing) {
        setEditingPresetId(json.preset.id);
        setSuccess("Graphic updated.");
      } else {
        // Keep the current styling/media as a batch-entry template, but return to
        // create mode so every subsequent save makes a new catalog record.
        setEditingPresetId(null);
        setPrimary("");
        setSecondary("");
        setSuccess("Graphic saved. Ready for the next catalog item.");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the graphic.");
    } finally {
      setSaving(false);
    }
  }

  function startNewGraphic() {
    setEditingPresetId(null);
    setPrimary("");
    setSecondary("");
    setError(null);
    setSuccess("Ready to create a new graphic with the current style.");
  }

  async function deletePreset(preset: OwnerGraphicsPreset) {
    if (deletingPresetId || !window.confirm(`Delete “${preset.content_primary}” from the master catalog?`)) return;
    setDeletingPresetId(preset.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/owner/graphics/presets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preset.id }),
      });
      const json = (await response.json()) as ApiPresetResponse;
      if (!response.ok || !json.success) throw new Error(json.error || "Unable to delete the graphic.");
      setPresets((current) => current.filter((item) => item.id !== preset.id));
      if (editingPresetId === preset.id) cancelEdit();
      setSuccess("Graphic deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete the graphic.");
    } finally {
      setDeletingPresetId(null);
    }
  }

  async function saveTheme(action: "save" | "reset") {
    if (themeSaving) return;
    setThemeSaving(true);
    setError(null);
    setSuccess(null);
    const next = action === "reset" ? {
      cornerRadiusPx: OWNER_GRAPHICS_DEFAULT_THEME.corner_radius_px,
      paddingPx: OWNER_GRAPHICS_DEFAULT_THEME.padding_px,
      backgroundOpacityPercent: OWNER_GRAPHICS_DEFAULT_THEME.background_opacity_percent,
      placementAnchor: OWNER_GRAPHICS_DEFAULT_THEME.placement_anchor,
      customLogoUrl: "",
    } : themeDraft;
    try {
      const response = await fetch("/api/owner/graphics/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const json = (await response.json()) as ApiThemeResponse;
      if (!response.ok || !json.success || !json.theme) throw new Error(json.error || "Unable to save theme defaults.");
      setTheme(json.theme);
      setThemeDraft(next);
      setSuccess(action === "reset" ? "Theme defaults restored." : "Theme defaults saved.");
    } catch (themeError) {
      setError(themeError instanceof Error ? themeError.message : "Unable to save theme defaults.");
    } finally {
      setThemeSaving(false);
    }
  }

  function beginDrag(event: PointerEvent<HTMLDivElement>) {
    if (!previewSurfaceRef.current || layoutMode === "fullscreen" || layoutMode === "sanctuary_video") return;
    const surface = previewSurfaceRef.current.getBoundingClientRect();
    const target = event.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = { x: ((event.clientX - target.left) / surface.width) * 100, y: ((event.clientY - target.top) / surface.height) * 100 };
    if (positionAnchor === "CENTER") setPositionAnchor("TOP_LEFT");
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!previewSurfaceRef.current || !dragOffsetRef.current) return;
    const surface = previewSurfaceRef.current.getBoundingClientRect();
    setXPercent(Math.max(0, Math.min(100 - widthPercent, Math.round(((event.clientX - surface.left) / surface.width) * 100 - dragOffsetRef.current.x))));
    setYPercent(Math.max(0, Math.min(100 - heightPercent, Math.round(((event.clientY - surface.top) / surface.height) * 100 - dragOffsetRef.current.y))));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    dragOffsetRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const panelClass = "rounded-[3px] border border-white/10 bg-[linear-gradient(135deg,#0b1012,#070a0c)] shadow-[0_10px_32px_rgba(0,0,0,0.28)]";
  const sectionTitle = "font-headline text-base uppercase tracking-[0.05em] text-white/80";
  const labelClass = "mb-1 block font-ui text-[0.56rem] font-semibold uppercase tracking-[0.06em] text-white/55";
  const inputClass = "h-9 w-full rounded-[2px] border border-white/15 bg-[#090d0f] px-3 font-body text-[0.72rem] text-white outline-none transition placeholder:text-white/25 focus:border-[#00bff8]/65";
  const rangeClass = "h-1 w-full cursor-pointer appearance-none rounded bg-white/15 accent-[#00bff8]";

  return (
    <div className="space-y-2">
      <GraphicsMonetizationRemindersPanel />

      {loading ? (
        <div className={`${panelClass} flex min-h-[28rem] items-center justify-center font-ui text-xs uppercase tracking-wider text-white/55`}>
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-[#00bff8]" /> Loading graphics workspace
        </div>
      ) : (
        <form onSubmit={(event) => void savePreset(event)} className="grid gap-2 lg:grid-cols-[minmax(31rem,0.94fr)_minmax(0,1.06fr)]">
          <section className={`${panelClass} min-w-0 overflow-hidden`}>
            <div className="border-b border-white/10 px-4 py-2">
              <h2 className="font-headline text-xl uppercase tracking-[0.05em] text-white/85">Graphic Builder</h2>
            </div>

            <div className="p-4">
              <fieldset>
                <legend className={sectionTitle}>1. Graphic Type</legend>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
                  {BUILDER_KINDS.map((kind) => {
                    const Icon = TYPE_ICONS[kind];
                    const active = selectedKind === kind;
                    return (
                      <button key={kind} type="button" aria-pressed={active} onClick={() => selectType(kind)} className={`flex min-h-[4.35rem] flex-col items-center justify-center gap-2 border px-1 transition first:rounded-l-[2px] last:rounded-r-[2px] ${active ? "relative z-10 border-[#00bff8] bg-[#00bff8]/5 text-[#00c7ff] shadow-[inset_0_-2px_0_#00bff8]" : "border-white/10 bg-[#090d0f] text-white/60 hover:border-white/25 hover:text-white"}`}>
                        <Icon className="h-5 w-5" />
                        <span className="font-ui text-[0.55rem] font-bold uppercase leading-tight tracking-[0.04em]">{builderLabel(kind)}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-4 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <fieldset>
                  <legend className={sectionTitle}>2. Content</legend>
                  <label className="mt-2 block">
                    <span className="flex items-center justify-between"><span className={labelClass}>{selectedHelp.primary}</span><span className="font-ui text-[0.5rem] text-white/45">{primary.length} / 120</span></span>
                    <input value={primary} maxLength={120} onChange={(event) => setPrimary(event.target.value)} placeholder={selectedHelp.placeholderPrimary} className={inputClass} />
                  </label>
                  <label className="mt-3 block">
                    <span className="flex items-center justify-between"><span className={labelClass}>{selectedHelp.secondary}</span><span className="font-ui text-[0.5rem] text-white/45">{secondary.length} / 260</span></span>
                    <input value={secondary} maxLength={260} onChange={(event) => setSecondary(event.target.value)} placeholder={selectedHelp.placeholderSecondary} className={inputClass} />
                  </label>
                </fieldset>

                <fieldset className="min-w-0 xl:border-l xl:border-white/10 xl:pl-4">
                  <legend className={sectionTitle}>3. Upload / Choose Media</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {UPLOAD_SLOTS.map((slot) => {
                      const asset = uploadedSlotAssets[slot.key];
                      const preview = asset?.url ?? slot.fallback;
                      const selected = asset?.url === imageUrl || asset?.url === mediaUrl || (!asset && preview === imageUrl);
                      return (
                        <label key={slot.key} className={`group relative min-w-0 cursor-pointer rounded-[2px] border p-1.5 transition ${selected ? "border-[#00bff8]/65" : "border-white/10 hover:border-white/30"}`}>
                          <span className={labelClass}>{slot.label}</span>
                          <span className="relative grid aspect-[1.65/1] place-items-center overflow-hidden rounded-[2px] bg-[#030506]">
                            {preview ? (
                              <Image src={preview} alt="" width={320} height={180} unoptimized className="h-full w-full object-cover" />
                            ) : <Film className="h-7 w-7 text-white/35" />}
                            {uploadingSlot === slot.key ? <span className="absolute inset-0 grid place-items-center bg-black/75"><Loader2 className="h-5 w-5 animate-spin text-[#00bff8]" /></span> : null}
                          </span>
                          <span className="mt-1.5 flex h-7 items-center justify-center gap-1 rounded-[2px] border border-white/15 bg-white/[0.03] font-ui text-[0.52rem] font-bold uppercase text-white/65 transition group-hover:text-white"><Upload className="h-3 w-3" /> Change</span>
                          <input type="file" accept={slot.accept} disabled={Boolean(uploadingSlot)} onChange={(event) => { void uploadAsset(slot.key, event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} className="sr-only" />
                        </label>
                      );
                    })}
                  </div>
                  <label className="mt-3 block">
                    <span className={labelClass}>Custom image path or URL</span>
                    <input value={isVideo ? mediaUrl : imageUrl} onChange={(event) => isVideo ? setMediaUrl(event.target.value) : setImageUrl(event.target.value)} placeholder="/owner-graphics/asset.png or https://…" className={inputClass} />
                  </label>
                </fieldset>
              </div>
            </div>

            <div className="grid border-t border-white/10 xl:grid-cols-[1.35fr_0.65fr]">
              <fieldset className="p-4">
                <legend className={sectionTitle}>4. Position &amp; Size</legend>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
                  {LAYOUT_OPTIONS.map((option) => (
                    <button key={option.value} type="button" onClick={() => { setLayoutMode(option.value); if (option.value === "fullscreen" || option.value === "sanctuary_video") setPositionAnchor("FULLSCREEN"); }} className={`min-h-11 border px-1 font-ui text-[0.49rem] font-bold uppercase leading-tight transition ${layoutMode === option.value ? "relative z-10 border-[#00bff8] bg-[#00bff8]/5 text-[#00c7ff]" : "border-white/10 bg-[#090d0f] text-white/55 hover:text-white"}`}>
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-5 sm:grid-cols-[6.25rem_1fr]">
                  <div>
                    <span className={labelClass}>Anchor</span>
                    <div className="grid grid-cols-3 gap-3 rounded-[2px] border border-white/10 bg-black/20 p-2">
                      {["TOP_LEFT", "TOP_RIGHT", "CENTER", "BOTTOM_LEFT", "BOTTOM_RIGHT", "FULLSCREEN"].map((anchor, index) => {
                        const gridPosition = ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-2 row-start-2", "col-start-1 row-start-3", "col-start-3 row-start-3", "col-start-2 row-start-3"][index];
                        return <button key={anchor} type="button" title={POSITION_OPTIONS.find((item) => item.value === anchor)?.label} aria-label={POSITION_OPTIONS.find((item) => item.value === anchor)?.label} onClick={() => setPositionAnchor(anchor as GraphicPositionAnchor)} className={`${gridPosition} h-3 w-3 rounded-full border transition ${positionAnchor === anchor ? "border-[#00bff8] bg-[#00bff8] shadow-[0_0_7px_#00bff8]" : "border-white/55 hover:border-white"}`} />;
                      })}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {[
                      { label: "X position", value: xPercent, set: setXPercent, min: 0, max: 95 },
                      { label: "Y position", value: yPercent, set: setYPercent, min: 0, max: 95 },
                      { label: "Width", value: widthPercent, set: setWidthPercent, min: 5, max: 100 },
                      { label: "Height", value: heightPercent, set: setHeightPercent, min: 5, max: 100 },
                      { label: "Layer (z-index)", value: zIndex, set: setZIndex, min: 0, max: 99 },
                    ].map((control) => (
                      <label key={control.label} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2">
                        <span className={`${labelClass} mb-0`}>{control.label}</span>
                        <input type="range" min={control.min} max={control.max} value={control.value} onChange={(event) => control.set(Number(event.target.value))} className={rangeClass} />
                        <input type="number" min={control.min} max={control.max} value={control.value} onChange={(event) => control.set(Number(event.target.value))} className="h-7 rounded-[2px] border border-white/15 bg-[#090d0f] px-1 text-center font-body text-[0.65rem] text-white outline-none focus:border-[#00bff8]/65" />
                      </label>
                    ))}
                  </div>
                </div>
              </fieldset>

              <fieldset className="border-t border-white/10 p-4 xl:border-l xl:border-t-0">
                <legend className={sectionTitle}>5. Duration</legend>
                <div className="mt-3 grid gap-3">
                  {(["manual", "15", "30", "custom"] as DurationMode[]).map((mode) => (
                    <label key={mode} className="flex cursor-pointer items-center gap-2 font-ui text-[0.62rem] uppercase text-white/65">
                      <input type="radio" name="duration" value={mode} checked={durationMode === mode} onChange={() => setDurationMode(mode)} className="h-4 w-4 accent-[#00bff8]" />
                      {mode === "manual" ? "Manual" : mode === "custom" ? "Custom" : `${mode} seconds`}
                    </label>
                  ))}
                  {durationMode === "custom" ? (
                    <label className="flex items-center gap-2">
                      <input type="number" min={1} max={3600} value={customDuration} onChange={(event) => setCustomDuration(Number(event.target.value))} className="h-8 w-20 rounded-[2px] border border-white/15 bg-[#090d0f] px-2 font-body text-xs text-white outline-none focus:border-[#00bff8]/65" />
                      <span className="font-ui text-[0.55rem] uppercase text-white/45">Seconds</span>
                    </label>
                  ) : null}
                </div>
              </fieldset>
            </div>

            <fieldset className="border-t border-white/10 p-4">
              <legend className={sectionTitle}>6. Theme Defaults</legend>
              <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr_auto] xl:items-end">
                <label><span className={labelClass}>Background opacity</span><span className="grid grid-cols-[1fr_2.5rem] items-center gap-2"><input type="range" min={0} max={100} value={themeDraft.backgroundOpacityPercent} onChange={(event) => setThemeDraft({ ...themeDraft, backgroundOpacityPercent: Number(event.target.value) })} className={rangeClass} /><span className="font-body text-xs text-white/65">{themeDraft.backgroundOpacityPercent}%</span></span></label>
                <label><span className={labelClass}>Padding</span><span className="grid grid-cols-[1fr_2rem] items-center gap-2"><input type="range" min={0} max={96} value={themeDraft.paddingPx} onChange={(event) => setThemeDraft({ ...themeDraft, paddingPx: Number(event.target.value) })} className={rangeClass} /><span className="font-body text-xs text-white/65">{themeDraft.paddingPx}</span></span></label>
                <label><span className={labelClass}>Placement anchor</span><select value={themeDraft.placementAnchor} onChange={(event) => setThemeDraft({ ...themeDraft, placementAnchor: event.target.value as GraphicsPlacementAnchor })} className={inputClass}>{POSITION_OPTIONS.filter((item) => item.value !== "FULLSCREEN").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
                <div className="flex gap-2">
                  <button type="button" disabled={themeSaving} onClick={() => void saveTheme("reset")} className="inline-flex h-9 items-center gap-1 rounded-[2px] border border-white/20 px-3 font-ui text-[0.54rem] font-bold uppercase text-white/65 transition hover:text-white disabled:opacity-45"><RotateCcw className="h-3 w-3" /> Reset</button>
                  <button type="button" disabled={themeSaving} onClick={() => void saveTheme("save")} className="inline-flex h-9 items-center gap-1 rounded-[2px] bg-[#00afe9] px-3 font-ui text-[0.54rem] font-black uppercase text-[#001018] transition hover:bg-[#35caff] disabled:opacity-45">{themeSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save Theme</button>
                </div>
              </div>
            </fieldset>

            {error || success ? <div role="status" className={`border-t px-4 py-2 font-body text-xs ${error ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"}`}>{error ?? success}</div> : null}

            <div className="grid gap-2 border-t border-white/10 p-4 sm:grid-cols-2">
              <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] bg-[#00afe9] font-ui text-[0.72rem] font-black uppercase tracking-[0.08em] text-[#001018] transition hover:bg-[#35caff] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editingPresetId ? "Save Changes" : "Save New Graphic"}</button>
              <button type="button" onClick={startNewGraphic} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[2px] border border-white/25 font-ui text-[0.72rem] font-bold uppercase tracking-[0.08em] text-white/65 transition hover:border-white/45 hover:text-white active:translate-y-px"><Plus className="h-4 w-4" /> Start New Graphic</button>
            </div>
          </section>

          <div className="min-w-0 space-y-2">
            <section className={`${panelClass} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                <h2 className="font-headline text-xl uppercase tracking-[0.05em] text-white/85">Live Preview (16:9)</h2>
                <span className="inline-flex items-center gap-1.5 font-ui text-[0.52rem] uppercase tracking-wider text-white/40"><Move className="h-3 w-3" /> Drag to position</span>
              </div>
              <div className="p-4">
                <div ref={previewSurfaceRef} className="relative aspect-video overflow-hidden rounded-[2px] border border-[#006ca0]/45 bg-[#020508] shadow-[inset_0_0_36px_rgba(0,0,0,0.55)]">
                  {selectedKind === "LOWER_THIRD" && layoutMode === "lower_third" ? (
                    <BroadcastLowerThirdPreset
                      mainText={primary || selectedHelp.placeholderPrimary}
                      subtitleText={secondary || selectedHelp.placeholderSecondary}
                      logoUrl={imageUrl.trim() || null}
                      className="h-full rounded-[2px]"
                    />
                  ) : (
                    <>
                      {isVideo && mediaUrl ? (
                        <video src={mediaUrl} muted autoPlay loop playsInline className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <Image src="/effects/hero-audience-banner.png" alt="Broadcast preview audience" fill sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                      )}
                      <div className="absolute inset-[2.5%] border border-dashed border-[#00bff8]/35" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-[#0075ff]/10" />

                      <div role="presentation" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className={`absolute z-10 touch-none select-none border border-dashed border-[#00bff8]/60 ${layoutMode === "fullscreen" || layoutMode === "sanctuary_video" ? "cursor-default" : "cursor-move"}`} style={previewBoxStyle}>
                        {layoutMode === "fullscreen" || layoutMode === "sanctuary_video" ? (
                          <div className="grid h-full w-full place-items-center bg-black/45 p-[5%] text-center backdrop-blur-[1px]">
                            {imageUrl ? (
                              <Image src={imageUrl} alt="" width={480} height={270} unoptimized className="mb-3 max-h-[38%] max-w-[44%] object-contain" />
                            ) : null}
                            <div><p className="font-headline text-[clamp(1.4rem,4vw,4.5rem)] uppercase leading-none tracking-[0.06em] text-white">{primary || "GRAPHIC TITLE"}</p><p className="mt-1 font-ui text-[clamp(.5rem,1.2vw,1.25rem)] uppercase tracking-[0.1em] text-white/75">{secondary}</p></div>
                          </div>
                        ) : layoutMode === "ticker" ? (
                          <div className="flex h-full min-h-10 w-full items-center border border-[#ff2c9f]/70 bg-black/90 px-[3%]"><strong className="mr-[3%] font-ui text-[clamp(.45rem,.9vw,.85rem)] uppercase text-[#ff3eaa]">{primary}</strong><span className="font-body text-[clamp(.4rem,.8vw,.8rem)] text-white">{secondary}</span></div>
                        ) : (
                          <div className="flex h-full min-h-16 w-full overflow-hidden border border-[#ff2c9f]/70 bg-[linear-gradient(100deg,rgba(3,7,10,.96),rgba(8,12,18,.9))] shadow-2xl" style={{ borderRadius: themeDraft.cornerRadiusPx, padding: Math.max(4, themeDraft.paddingPx / 4), backgroundColor: `rgba(2,5,8,${themeDraft.backgroundOpacityPercent / 100})` }}>
                            {imageUrl ? <div className="mr-[3%] flex w-[22%] shrink-0 items-center justify-center border-r border-[#ff2c9f]/50 bg-black/35 p-[2%]"><Image src={imageUrl} alt="" width={320} height={180} unoptimized className="max-h-full max-w-full object-contain" /></div> : null}
                            <div className="flex min-w-0 flex-1 flex-col justify-center"><p className="truncate font-headline text-[clamp(.8rem,2.2vw,2.65rem)] uppercase leading-none tracking-[0.04em] text-white">{primary || "PRIMARY TEXT"}</p><p className="mt-[1%] truncate font-ui text-[clamp(.42rem,.75vw,.8rem)] uppercase tracking-[0.08em] text-white/75">{secondary}</p></div>
                          </div>
                        )}
                        {["-left-1 -top-1", "-right-1 -top-1", "-bottom-1 -left-1", "-bottom-1 -right-1", "-bottom-1 left-1/2"].map((position) => <span key={position} className={`absolute h-2 w-2 rounded-[1px] bg-[#00bff8] ${position}`} />)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            <section className={`${panelClass} overflow-hidden`}>
              <div className="flex items-end justify-between border-b border-white/10 px-4 py-3">
                <div><h2 className="font-headline text-xl uppercase tracking-[0.05em] text-white/85">Master Graphics Catalog</h2><p className="mt-1 font-ui text-[0.55rem] uppercase tracking-[0.08em] text-white/45">Saved items: {presets.length} <span aria-hidden="true">/</span> 20+ supported</p></div>
                <button type="button" onClick={() => void loadWorkspace()} className="inline-flex h-8 items-center gap-1 rounded-[2px] border border-white/15 px-2 font-ui text-[0.52rem] font-bold uppercase text-white/55 transition hover:text-white"><RotateCcw className="h-3 w-3" /> Refresh</button>
              </div>
              <div className="max-h-[31rem] overflow-auto p-2">
                {presets.length === 0 ? (
                  <div className="grid min-h-44 place-items-center rounded-[2px] border border-dashed border-white/15 text-center"><div><ImageIcon className="mx-auto h-7 w-7 text-white/25" /><p className="mt-2 font-ui text-[0.62rem] uppercase tracking-wider text-white/45">No graphics saved yet</p><p className="mt-1 font-body text-xs text-white/30">Build and save the first catalog item.</p></div></div>
                ) : (
                  <table className="w-full min-w-[680px] border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[#0c1113] font-ui text-[0.52rem] uppercase tracking-[0.07em] text-white/50"><tr><th className="px-2 py-2">ID</th><th className="px-2 py-2">Type</th><th className="px-2 py-2">Primary Text</th><th className="px-2 py-2">Secondary / Media</th><th className="px-2 py-2">Layout</th><th className="px-2 py-2">Duration</th><th className="px-2 py-2">Actions</th></tr></thead>
                    <tbody>
                      {presets.map((preset, index) => {
                        const metadata = decodeGraphicsPresetMetadata(preset);
                        return (
                          <tr key={preset.id} className={`border-t border-white/[0.07] font-body text-[0.65rem] text-white/68 transition hover:bg-white/[0.025] ${preset.is_active_on_stream ? "bg-[#7ee92d]/[0.04]" : ""}`}>
                            <td className="whitespace-nowrap px-2 py-2 font-ui text-white/60">{catalogId(preset, index)}</td>
                            <td className="px-2 py-2"><span className={`inline-flex rounded-[2px] border px-1.5 py-1 font-ui text-[0.48rem] font-bold uppercase ${typeColor(metadata.builderKind)}`}>{builderLabel(metadata.builderKind)}</span></td>
                            <td className="max-w-36 truncate px-2 py-2 text-white/80" title={preset.content_primary}>{preset.content_primary}</td>
                            <td className="max-w-44 truncate px-2 py-2" title={metadata.secondaryText ?? metadata.mediaUrl ?? ""}>{metadata.secondaryText ?? metadata.mediaUrl ?? "—"}</td>
                            <td className="whitespace-nowrap px-2 py-2 capitalize">{metadata.layoutMode.replaceAll("_", " ")}</td>
                            <td className="whitespace-nowrap px-2 py-2">{preset.duration_seconds ? `${preset.duration_seconds} sec` : "Manual"}</td>
                            <td className="px-2 py-2"><div className="flex items-center gap-2"><button type="button" onClick={() => editPreset(preset)} aria-label={`Edit ${preset.content_primary}`} className="text-white/65 transition hover:text-[#00bff8]"><Pencil className="h-4 w-4" /></button><button type="button" disabled={deletingPresetId === preset.id} onClick={() => void deletePreset(preset)} aria-label={`Delete ${preset.content_primary}`} className="text-red-500 transition hover:text-red-300 disabled:opacity-40">{deletingPresetId === preset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button><GripVertical className="h-4 w-4 text-white/20" /></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </form>
      )}
    </div>
  );
}
