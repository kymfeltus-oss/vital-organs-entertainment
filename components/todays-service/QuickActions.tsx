"use client";

import {
  Camera,
  Clock,
  Globe,
  Mic2,
  MonitorPlay,
  Radio,
  Video,
} from "lucide-react";
import { BeginServiceButton, TS } from "@/components/todays-service/ServiceUi";
import {
  previewBroadcastApi,
  startCountdownApi,
  testCameraApi,
  testInternetApi,
  testRecordingApi,
  testSoundApi,
  testStreamingApi,
} from "@/lib/todays-service/api";
import type { Camera as CameraType, StreamingDestination } from "@/lib/todays-service/types";

type QuickActionsProps = {
  cameras: CameraType[];
  destinations: StreamingDestination[];
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
  onBeginService: () => void;
};

const ACTIONS = [
  { key: "sound", label: "Sound Check", icon: Mic2 },
  { key: "camera", label: "Camera Check", icon: Camera },
  { key: "internet", label: "Test Internet", icon: Globe },
  { key: "livestream", label: "Test Livestream", icon: Radio },
  { key: "recording", label: "Test Recording", icon: Video },
  { key: "preview", label: "Preview Broadcast", icon: MonitorPlay },
  { key: "countdown", label: "Start Countdown", icon: Clock },
] as const;

export default function QuickActions({
  cameras,
  destinations,
  onReload,
  onToast,
  onBeginService,
}: QuickActionsProps) {
  const run = async (key: (typeof ACTIONS)[number]["key"]) => {
    switch (key) {
      case "sound": {
        const r = await testSoundApi();
        await onReload();
        onToast(r.success ? "success" : "error", r.message);
        break;
      }
      case "camera": {
        const cam = cameras[0];
        if (!cam) { onToast("error", "Add a camera first."); return; }
        const r = await testCameraApi(cam.id);
        await onReload();
        onToast(r.success ? "success" : "error", r.message);
        break;
      }
      case "internet": {
        const r = await testInternetApi();
        await onReload();
        onToast(r.success ? "success" : "error", r.message);
        break;
      }
      case "livestream": {
        const dest = destinations[0];
        if (!dest) { onToast("error", "Add a destination first."); return; }
        const r = await testStreamingApi(dest.id);
        await onReload();
        onToast(r.success ? "success" : "error", r.message);
        break;
      }
      case "recording": {
        const r = await testRecordingApi();
        await onReload();
        onToast(r.success ? "success" : "error", r.message);
        break;
      }
      case "preview": {
        const r = await previewBroadcastApi();
        if (r.details?.previewUrl) window.open(String(r.details.previewUrl), "_blank");
        onToast(r.success ? "success" : "error", r.message);
        break;
      }
      case "countdown": {
        const r = await startCountdownApi();
        onToast(r.success ? "success" : "error", r.message);
        break;
      }
    }
  };

  return (
    <section
      aria-label="Quick actions"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0a0a0c]/95 px-4 py-3 backdrop-blur-md lg:left-[220px]"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className={`${TS.secondaryMuted} font-bold tracking-[0.14em]`}>Quick Actions</h2>
        <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-center">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => void run(action.key)}
                className={`${TS.btnOutline} gap-2 px-3 py-2`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {action.label}
              </button>
            );
          })}
        </div>
        <BeginServiceButton onClick={onBeginService} compact />
      </div>
    </section>
  );
}
