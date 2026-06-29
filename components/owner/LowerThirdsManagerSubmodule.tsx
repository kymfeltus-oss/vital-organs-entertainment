"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

type LowerThirdThemeStyle = "NEON_PURPLE_SLIDE" | "MINIMAL_GLASS_FADE" | "CYAN_GLOW";

type LowerThirdAssetRow = {
  id: string;
  speaker_name: string;
  speaker_role: string;
  theme_style: LowerThirdThemeStyle;
  display_order: number;
  is_active_on_stream: boolean;
};

type LowerThirdsResponse = {
  success?: boolean;
  assets?: LowerThirdAssetRow[];
  asset?: LowerThirdAssetRow;
  error?: string;
};

type ThemeOption = {
  value: LowerThirdThemeStyle;
  label: string;
  previewClass: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "CYAN_GLOW",
    label: "Cyan Glow Dynamic Profile",
    previewClass: "border-cyan-400 shadow-cyan-500/30",
  },
  {
    value: "NEON_PURPLE_SLIDE",
    label: "Neon Purple Stage Variant",
    previewClass: "border-fuchsia-400 shadow-fuchsia-500/30",
  },
  {
    value: "MINIMAL_GLASS_FADE",
    label: "Minimal Glass Clean",
    previewClass: "border-white/40 shadow-white/10",
  },
];

function safeText(value: string, maxLength: number): string {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function themePreviewClass(themeStyle: LowerThirdThemeStyle): string {
  return THEME_OPTIONS.find((theme) => theme.value === themeStyle)?.previewClass ?? THEME_OPTIONS[0].previewClass;
}

async function readLowerThirdsResponse(response: Response): Promise<LowerThirdsResponse> {
  const data = (await response.json().catch(() => ({}))) as LowerThirdsResponse;
  if (!response.ok || data.success !== true) {
    throw new Error(data.error ?? "Lower-thirds transaction failed.");
  }
  return data;
}

export default function LowerThirdsManagerSubmodule() {
  const [assets, setAssets] = useState<LowerThirdAssetRow[]>([]);
  const [speakerName, setSpeakerName] = useState("");
  const [speakerRole, setSpeakerRole] = useState("");
  const [themeStyle, setThemeStyle] = useState<LowerThirdThemeStyle>("CYAN_GLOW");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedId) ?? null,
    [assets, selectedId],
  );

  const fetchLowerThirds = useCallback(async () => {
    try {
      const response = await fetch("/api/owner/lower-thirds", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = await readLowerThirdsResponse(response);
      setAssets(data.assets ?? []);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load graphics queue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLowerThirds();

    const supabase = getSupabase();
    const realtimeChannel = supabase
      .channel("owner-lower-thirds-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "owner_lower_thirds",
          filter: "event_id=eq.300-awakening",
        },
        () => {
          void fetchLowerThirds();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(realtimeChannel);
    };
  }, [fetchLowerThirds]);

  const resetForm = () => {
    setSelectedId(null);
    setSpeakerName("");
    setSpeakerRole("");
    setThemeStyle("CYAN_GLOW");
  };

  const handleAddOrUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanSpeakerName = safeText(speakerName, 120);
    const cleanSpeakerRole = safeText(speakerRole, 120);

    if (!cleanSpeakerName || !cleanSpeakerRole) {
      setErrorMessage("Speaker name and role are required.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/owner/lower-thirds", {
        method: selectedId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selectedId
            ? {
                id: selectedId,
                speakerName: cleanSpeakerName,
                speakerRole: cleanSpeakerRole,
                themeStyle,
              }
            : {
                speakerName: cleanSpeakerName,
                speakerRole: cleanSpeakerRole,
                themeStyle,
                displayOrder: assets.length + 1,
              },
        ),
      });

      await readLowerThirdsResponse(response);
      setSuccessMessage(selectedId ? "Lower-third asset updated." : "Lower-third asset queued.");
      resetForm();
      await fetchLowerThirds();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save lower-third asset.");
    } finally {
      setIsProcessing(false);
    }
  };

  const editAsset = (asset: LowerThirdAssetRow) => {
    setSelectedId(asset.id);
    setSpeakerName(asset.speaker_name);
    setSpeakerRole(asset.speaker_role);
    setThemeStyle(asset.theme_style);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const toggleLiveState = async (asset: LowerThirdAssetRow) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const previousAssets = assets;
    const nextLiveState = !asset.is_active_on_stream;
    setAssets((current) =>
      current.map((item) => ({
        ...item,
        is_active_on_stream: item.id === asset.id ? nextLiveState : nextLiveState ? false : item.is_active_on_stream,
      })),
    );

    try {
      if (nextLiveState) {
        const activeAssets = previousAssets.filter(
          (item) => item.is_active_on_stream && item.id !== asset.id,
        );
        await Promise.all(
          activeAssets.map((item) =>
            fetch("/api/owner/lower-thirds", {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: item.id, isActiveOnStream: false }),
            }).then(readLowerThirdsResponse),
          ),
        );
      }

      const response = await fetch("/api/owner/lower-thirds", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: asset.id, isActiveOnStream: nextLiveState }),
      });
      await readLowerThirdsResponse(response);
      setSuccessMessage(nextLiveState ? "Lower-third taken live." : "Lower-third removed from live feed.");
      await fetchLowerThirds();
    } catch (error) {
      setAssets(previousAssets);
      setErrorMessage(error instanceof Error ? error.message : "Failed to route visual layer.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="rounded-[8px] border border-[#FF2FCF]/55 bg-zinc-950 p-4 font-mono text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_22px_rgba(0,0,0,0.28)]">
      <h2 className="mb-3 border-b border-zinc-800 pb-2 text-xs font-bold tracking-wider text-blue-400 uppercase">
        8. Graphics / Lower Thirds Production Generator
      </h2>

      <div className="relative mb-4 flex aspect-[21/9] w-full flex-col items-center justify-center overflow-hidden rounded border border-zinc-800 bg-zinc-900 p-4">
        <div className="absolute top-2 left-2 text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
          Stream Overlays Preview Monitor
        </div>
        <div
          className={`max-w-xs rounded border bg-black/60 p-3 text-center shadow-2xl transition ${themePreviewClass(themeStyle)}`}
        >
          <h3 className="break-words text-sm font-black tracking-widest text-white uppercase">
            {speakerName.trim() || selectedAsset?.speaker_name || "New Speaker"}
          </h3>
          <p className="mt-1 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
            {speakerRole.trim() || selectedAsset?.speaker_role || "Role Description"}
          </p>
        </div>
      </div>

      <form data-testid="lower-thirds-manager-form" onSubmit={handleAddOrUpdate} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            data-testid="lower-thirds-speaker-name-input"
            type="text"
            placeholder="Speaker Name"
            value={speakerName}
            onChange={(event) => setSpeakerName(event.target.value)}
            className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-xs text-white outline-none focus:border-zinc-600"
          />
          <input
            data-testid="lower-thirds-speaker-role-input"
            type="text"
            placeholder="Speaker Role / Context"
            value={speakerRole}
            onChange={(event) => setSpeakerRole(event.target.value)}
            className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-xs text-white outline-none focus:border-zinc-600"
          />
        </div>

        <select
          data-testid="lower-thirds-theme-select"
          value={themeStyle}
          onChange={(event) => setThemeStyle(event.target.value as LowerThirdThemeStyle)}
          className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-xs text-white outline-none focus:border-zinc-600"
        >
          {THEME_OPTIONS.map((theme) => (
            <option key={theme.value} value={theme.value}>
              {theme.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            data-testid="lower-thirds-save-button"
            type="submit"
            disabled={isProcessing}
            className="flex-1 rounded bg-pink-600 p-2 text-xs font-bold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isProcessing ? "Processing" : selectedId ? "Save Modifications" : "Queue Asset Component"}
          </button>
          {selectedId ? (
            <button
              data-testid="lower-thirds-cancel-edit-button"
              type="button"
              onClick={resetForm}
              disabled={isProcessing}
              className="rounded bg-zinc-800 px-3 text-xs text-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {errorMessage ? (
        <div className="mt-3 rounded border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-200" data-testid="lower-thirds-error">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="mt-3 rounded border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300" data-testid="lower-thirds-success">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-4 max-h-48 space-y-2 overflow-y-auto border-t border-zinc-900 pt-3">
        {isLoading ? (
          <div className="rounded border border-zinc-900 bg-zinc-900/50 p-3 text-xs text-zinc-500">
            Loading lower-thirds queue...
          </div>
        ) : assets.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
            No lower-third assets queued yet.
          </div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center justify-between gap-3 rounded border border-zinc-900 bg-zinc-900/60 p-2 text-xs"
            >
              <div className="min-w-0">
                <span className="block truncate font-bold text-zinc-200">{asset.speaker_name}</span>
                <span className="block truncate text-[10px] text-zinc-500">{asset.speaker_role}</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  data-testid={`lower-thirds-edit-${asset.id}`}
                  type="button"
                  onClick={() => editAsset(asset)}
                  disabled={isProcessing}
                  className="px-1.5 text-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Edit
                </button>
                <button
                  data-testid={`lower-thirds-toggle-live-${asset.id}`}
                  type="button"
                  onClick={() => void toggleLiveState(asset)}
                  disabled={isProcessing}
                  className={`rounded border px-2 py-0.5 text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                    asset.is_active_on_stream
                      ? "border-emerald-700 bg-emerald-950 text-emerald-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {asset.is_active_on_stream ? "LIVE ON FEED" : "TAKE STAGE"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
