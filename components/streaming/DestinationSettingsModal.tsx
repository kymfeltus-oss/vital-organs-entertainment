"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import ChurchWebsiteForm from "@/components/streaming/ChurchWebsiteForm";
import CustomRtmpForm from "@/components/streaming/CustomRtmpForm";
import { TS } from "@/components/todays-service/ServiceUi";
import { updateStreamingDestinationApi } from "@/lib/streaming/api";
import { normalizeChurchWebsiteSettings, withChurchWebsiteDefaults } from "@/lib/streaming/church-website-shared";
import { normalizePlatform } from "@/lib/streaming/platforms";
import type { ChurchWebsiteSettings, CustomRtmpSettings } from "@/lib/streaming/types";
import type { StreamingDestination } from "@/lib/todays-service/types";

type DestinationSettingsModalProps = {
  open: boolean;
  destination: StreamingDestination | null;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

export default function DestinationSettingsModal({
  open,
  destination,
  onClose,
  onSaved,
  onToast,
}: DestinationSettingsModalProps) {
  const [busy, setBusy] = useState(false);
  const platform = destination ? normalizePlatform(destination.platform) : "";
  const [churchWebsite, setChurchWebsite] = useState<ChurchWebsiteSettings>(() =>
    withChurchWebsiteDefaults({
      websiteName: String(destination?.settingsJson?.websiteName ?? destination?.destinationName ?? ""),
      streamPageUrl: String(destination?.settingsJson?.streamPageUrl ?? destination?.streamPageUrl ?? ""),
      embedMethod: String(destination?.settingsJson?.embedMethod ?? destination?.embedMethod ?? "iframe"),
    }),
  );
  const [customRtmp, setCustomRtmp] = useState<CustomRtmpSettings>({
    serverName: String(destination?.settingsJson?.serverName ?? destination?.destinationName ?? ""),
    streamUrl: "",
    streamKey: "",
    backupStreamUrl: "",
  });

  if (!open || !destination) return null;

  const save = async () => {
    setBusy(true);
    try {
      if (platform === "church_website") {
        const normalized = normalizeChurchWebsiteSettings(churchWebsite);
        await updateStreamingDestinationApi(destination.id, {
          destinationName: normalized.websiteName || destination.destinationName,
          settingsJson: normalized,
          streamUrl: normalized.streamPageUrl,
          websiteName: normalized.websiteName,
          websiteUrl: normalized.websiteUrl,
          streamPageUrl: normalized.streamPageUrl,
          embedMethod: normalized.embedMethod,
          connectionStatus: "connected",
          validationStatus: "not_validated",
          validationReason: null,
          lastValidationError: null,
        });
      } else if (platform === "custom_rtmp") {
        await updateStreamingDestinationApi(destination.id, {
          destinationName: customRtmp.serverName,
          settingsJson: { serverName: customRtmp.serverName },
          streamUrl: customRtmp.streamUrl,
          streamKey: customRtmp.streamKey,
          backupStreamUrl: customRtmp.backupStreamUrl,
          connectionStatus: "connected",
        });
      }
      await onSaved();
      onToast("success", "Settings saved.");
      onClose();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className={`${TS.panel} w-full max-w-lg rounded-xl p-5`}>
        <h2 className="font-headline text-xl uppercase tracking-[0.08em] text-white">Settings</h2>
        <div className="mt-4">
          {platform === "church_website" ? (
            <ChurchWebsiteForm value={churchWebsite} onChange={setChurchWebsite} disabled={busy} />
          ) : null}
          {platform === "custom_rtmp" ? (
            <CustomRtmpForm value={customRtmp} onChange={setCustomRtmp} disabled={busy} />
          ) : null}
          {platform !== "church_website" && platform !== "custom_rtmp" ? (
            <p className="font-body text-sm text-white/65">
              Stream title and privacy settings for {destination.destinationName}.
            </p>
          ) : null}
        </div>
        <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
          <button type="button" disabled={busy} onClick={() => void save()} className={TS.btnPrimary}>Save</button>
          <button type="button" disabled={busy} onClick={onClose} className={TS.btnOutline}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
