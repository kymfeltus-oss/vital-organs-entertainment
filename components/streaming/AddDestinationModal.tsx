"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import AdvancedSettingsAccordion from "@/components/todays-service/AdvancedSettingsAccordion";
import ChurchWebsiteForm from "@/components/streaming/ChurchWebsiteForm";
import CustomRtmpForm from "@/components/streaming/CustomRtmpForm";
import OAuthConnectButton from "@/components/streaming/OAuthConnectButton";
import { TS } from "@/components/todays-service/ServiceUi";
import { createStreamingDestinationApi, startStreamingOAuthApi } from "@/lib/streaming/api";
import { normalizeChurchWebsiteSettings } from "@/lib/streaming/church-website-shared";
import { STREAMING_PLATFORMS } from "@/lib/streaming/platforms";
import type { ChurchWebsiteSettings, CustomRtmpSettings, StreamingPlatform } from "@/lib/streaming/types";

type AddDestinationModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

export default function AddDestinationModal({ open, onClose, onCreated, onToast }: AddDestinationModalProps) {
  const [step, setStep] = useState<"choose" | "setup">("choose");
  const [platform, setPlatform] = useState<StreamingPlatform | "">("");
  const [busy, setBusy] = useState(false);
  const [devMessage, setDevMessage] = useState<string | null>(null);
  const [churchWebsite, setChurchWebsite] = useState<ChurchWebsiteSettings>({
    websiteName: "",
    streamPageUrl: "",
    embedMethod: "iframe",
  });
  const [customRtmp, setCustomRtmp] = useState<CustomRtmpSettings>({
    serverName: "",
    streamUrl: "",
    streamKey: "",
    backupStreamUrl: "",
  });

  if (!open) return null;

  const visiblePlatforms = STREAMING_PLATFORMS.filter((p) => !p.advanced);
  const advancedPlatforms = STREAMING_PLATFORMS.filter((p) => p.advanced);

  const reset = () => {
    setStep("choose");
    setPlatform("");
    setDevMessage(null);
  };

  const handleCreateAndConnect = async () => {
    if (!platform) return;
    setBusy(true);
    try {
      const meta = STREAMING_PLATFORMS.find((p) => p.id === platform);
      const normalizedChurchWebsite =
        platform === "church_website"
          ? normalizeChurchWebsiteSettings(churchWebsite)
          : null;
      const item = await createStreamingDestinationApi({
        platform,
        displayName: normalizedChurchWebsite?.websiteName || meta?.label,
        settings:
          platform === "church_website"
            ? normalizedChurchWebsite
            : platform === "custom_rtmp"
              ? { serverName: customRtmp.serverName }
              : {},
        streamUrl:
          platform === "custom_rtmp"
            ? customRtmp.streamUrl
            : normalizedChurchWebsite?.streamPageUrl,
        streamKey: platform === "custom_rtmp" ? customRtmp.streamKey : undefined,
        backupStreamUrl: customRtmp.backupStreamUrl,
      });

      if (meta?.oauth) {
        const oauth = await startStreamingOAuthApi(platform, item.id);
        if (oauth.authorizationUrl) {
          window.location.href = oauth.authorizationUrl;
          return;
        }
        setDevMessage(oauth.developmentMessage);
        await onCreated();
        onToast("success", "Destination created. Connect your account when credentials are ready.");
        return;
      }

      await onCreated();
      onToast("success", "Streaming destination saved.");
      reset();
      onClose();
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Could not add destination.");
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className={`${TS.panel} w-full max-w-lg rounded-xl p-5`}>
        <h2 className="font-headline text-xl uppercase tracking-[0.08em] text-white">
          {step === "choose" ? "Where would you like to stream?" : "Set Up Streaming"}
        </h2>

        {step === "choose" ? (
          <>
            <div className="mt-4 space-y-2">
              {visiblePlatforms.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy}
                  onClick={() => { setPlatform(option.id); setStep("setup"); }}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-left transition ${
                    platform === option.id ? "border-[#00f2ff]/50 bg-[#00f2ff]/10" : "border-white/10 bg-black/30 hover:border-white/20"
                  }`}
                >
                  <span className="font-body text-sm font-semibold text-white">{option.label}</span>
                  <span className="mt-1 block font-body text-xs text-white/55">{option.description}</span>
                </button>
              ))}
            </div>
            <AdvancedSettingsAccordion>
              <div className="space-y-2">
                {advancedPlatforms.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={busy}
                    onClick={() => { setPlatform(option.id); setStep("setup"); }}
                    className={`block w-full rounded-lg border px-3 py-2 text-left ${platform === option.id ? "border-[#00f2ff]/50 bg-[#00f2ff]/10" : "border-white/10 bg-black/30"}`}
                  >
                    <span className="font-body text-sm text-white">{option.label}</span>
                  </button>
                ))}
              </div>
            </AdvancedSettingsAccordion>
          </>
        ) : (
          <div className="mt-4">
            {platform === "church_website" ? (
              <>
                <p className="font-body text-sm text-white/65">Tell us where your church website live page lives.</p>
                <div className="mt-3">
                  <ChurchWebsiteForm value={churchWebsite} onChange={setChurchWebsite} disabled={busy} />
                </div>
                <button type="button" disabled={busy} onClick={() => void handleCreateAndConnect()} className={`${TS.btnPrimary} mt-4`}>
                  Set Up Church Website
                </button>
              </>
            ) : null}

            {platform === "custom_rtmp" ? (
              <>
                <CustomRtmpForm value={customRtmp} onChange={setCustomRtmp} disabled={busy} />
                <button type="button" disabled={busy} onClick={() => void handleCreateAndConnect()} className={`${TS.btnPrimary} mt-4`}>
                  Save Advanced Setup
                </button>
              </>
            ) : null}

            {platform && platform !== "church_website" && platform !== "custom_rtmp" ? (
              <OAuthConnectButton
                developmentMessage={devMessage}
                disabled={busy}
                onConnect={() => void handleCreateAndConnect()}
              />
            ) : null}
          </div>
        )}

        <div className="mt-5 flex gap-2 border-t border-white/10 pt-4">
          {step === "setup" ? (
            <button type="button" disabled={busy} onClick={() => setStep("choose")} className={TS.btnOutline}>Back</button>
          ) : null}
          <button type="button" disabled={busy} onClick={() => { reset(); onClose(); }} className={TS.btnOutline}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
