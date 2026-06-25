"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import DeleteConfirmDialog from "@/components/todays-service/DeleteConfirmDialog";
import GuidedEmptyState from "@/components/todays-service/GuidedEmptyState";
import { IconBtn, ServiceCard, SubLabel, TS } from "@/components/todays-service/ServiceUi";
import { Trash2 } from "lucide-react";
import {
  connectionTypeLabel,
  formatLatency,
  formatMbps,
  INTERNET_UI,
  streamingQualityLabel,
} from "@/lib/internet/labels";
import { runInternetSpeedTestApi } from "@/lib/internet/api";
import { deleteInternetApi } from "@/lib/todays-service/api";
import type { TenantEquipmentProfile } from "@/lib/todays-service/equipment-onboarding";
import type { InternetConnection } from "@/lib/todays-service/types";

const InternetSetupWizard = dynamic(
  () => import("@/components/todays-service/internet-setup/InternetSetupWizard"),
  { ssr: false },
);

type InternetSectionProps = {
  connections: InternetConnection[];
  equipmentProfile: TenantEquipmentProfile | null;
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

export default function InternetSection({
  connections,
  equipmentProfile,
  onReload,
  onToast,
}: InternetSectionProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const primary = connections.find((c) => !c.isBackup);
  const backups = connections.filter((c) => c.isBackup);

  return (
    <ServiceCard
      title="Internet"
      action={
        <button type="button" onClick={() => setWizardOpen(true)} className={TS.link}>
          {primary ? "Setup Internet" : "Setup Internet"}
        </button>
      }
    >
      {!primary ? (
        <GuidedEmptyState
          title="Let's check your internet."
          intro="Parable detects whether your computer already has internet—it does not connect on its own."
          bullets={[
            "See if your computer is online through Wi-Fi or Ethernet",
            "Measure upload, download, and latency on this computer",
            "Optionally save the network for today's service",
          ]}
          actionLabel="Setup Internet"
          onAction={() => setWizardOpen(true)}
        />
      ) : (
        <div className="rounded-lg border border-white/8 bg-black/50 p-3">
          <SubLabel>Saved Network</SubLabel>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="font-body text-sm text-white">{primary.connectionName}</p>
              <p className="font-body text-xs text-white/50">
                {connectionTypeLabel(primary.connectionType)}
                {primary.ssid ? ` · ${primary.ssid}` : ""}
              </p>
            </div>
            <span className="font-ui text-[0.52rem] font-bold uppercase text-[#53fc18]">{INTERNET_UI.savedInParable}</span>
          </div>
          <p className="mt-2 font-body text-xs text-white/45">{INTERNET_UI.usingCurrentNetwork}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[0.75rem] text-white/55">
            <span>Upload: {formatMbps(primary.lastTestMbps)}</span>
            <span>Download: {formatMbps(primary.downloadMbps)}</span>
            <span>Latency: {formatLatency(primary.latencyMs)}</span>
            <span>{streamingQualityLabel(primary.streamingQuality ?? "unknown")}</span>
          </div>
          <p className="mt-2 font-body text-xs text-white/45">{INTERNET_UI.speedTestNote}</p>
          <button
            type="button"
            className={`mt-3 ${TS.btnBlue}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await runInternetSpeedTestApi();
                await onReload();
                onToast(r.success ? "success" : "error", r.message);
              } catch (err) {
                onToast("error", err instanceof Error ? err.message : "Test failed.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Test Computer Connection
          </button>
        </div>
      )}

      {backups.map((conn) => (
        <div key={conn.id} className="flex items-center justify-between rounded-lg border border-white/8 bg-black/40 px-3 py-2">
          <div>
            <SubLabel>Backup Connection</SubLabel>
            <p className="font-body text-sm text-white">{conn.connectionName}</p>
            <p className="font-body text-xs text-white/50">{streamingQualityLabel(conn.streamingQuality ?? "unknown")}</p>
          </div>
          <IconBtn icon={Trash2} label="Delete" onClick={() => setDeleteId(conn.id)} danger />
        </div>
      ))}

      {primary ? (
        <button type="button" className={TS.btnOutline} onClick={() => setWizardOpen(true)}>
          Change Connection
        </button>
      ) : null}

      <InternetSetupWizard
        open={wizardOpen}
        connections={connections}
        equipmentProfile={equipmentProfile}
        onClose={() => setWizardOpen(false)}
        onSaved={onReload}
        onToast={onToast}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Connection"
        message="Remove this internet connection?"
        onConfirm={async () => {
          if (!deleteId) return;
          setBusy(true);
          try {
            await deleteInternetApi(deleteId);
            await onReload();
            onToast("success", "Removed.");
          } catch (err) {
            onToast("error", err instanceof Error ? err.message : "Delete failed.");
          } finally {
            setBusy(false);
            setDeleteId(null);
          }
        }}
        onClose={() => setDeleteId(null)}
        confirming={busy}
      />
    </ServiceCard>
  );
}
