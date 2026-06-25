"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { FormField } from "@/components/todays-service/AddEditItemModal";
import DeleteConfirmDialog from "@/components/todays-service/DeleteConfirmDialog";
import GuidedEmptyState from "@/components/todays-service/GuidedEmptyState";
import { MetaGrid, ServiceCard, TS } from "@/components/todays-service/ServiceUi";
import {
  deleteRecordingApi,
  testRecordingApi,
  updateRecordingApi,
  upsertRecordingApi,
} from "@/lib/todays-service/api";
import { volunteerStatusLabel } from "@/lib/todays-service/coaching";
import type { RecordingSetting } from "@/lib/todays-service/types";

const AddEditItemModal = dynamic(() => import("@/components/todays-service/AddEditItemModal"), {
  ssr: false,
});

type RecordingSectionProps = {
  settings: RecordingSetting[];
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

const RECORD_FIELDS: FormField[] = [
  { key: "recordingName", label: "Recording Name", required: true },
  { key: "saveLocation", label: "Save Location", required: true },
  { key: "backupRecording", label: "Backup Recording", type: "checkbox" },
  { key: "storageRemainingGb", label: "Storage Remaining (GB)", type: "number" },
];

export default function RecordingSection({ settings, onReload, onToast }: RecordingSectionProps) {
  const setting = settings[0];
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const isEmpty = !setting?.saveLocation;

  const openEdit = () => {
    setDraft({
      recordingName: setting?.recordingName ?? "Service Recording",
      saveLocation: setting?.saveLocation ?? "",
      backupRecording: setting?.backupRecording ?? false,
      storageRemainingGb: setting?.storageRemainingGb ?? "",
    });
    setModalOpen(true);
  };

  return (
    <ServiceCard
      title="Recording"
      action={!isEmpty ? <button type="button" onClick={openEdit} className={TS.link}>View Recording</button> : null}
    >
      {isEmpty ? (
        <GuidedEmptyState
          title="Let's make sure today's service is recorded."
          intro="We'll help you choose where recordings are saved and confirm everything is working."
          bullets={["Pick a save location", "Turn recording on", "Run a quick test"]}
          actionLabel="Setup Recording"
          onAction={openEdit}
        />
      ) : (
        <MetaGrid
          items={[
            { label: "Status", value: setting!.recordingEnabled ? "On" : "Ready to turn on", highlight: setting!.recordingEnabled },
            { label: "Save Location", value: setting!.saveLocation || "—" },
            {
              label: "Space Remaining",
              value: setting!.storageRemainingGb != null ? `${setting!.storageRemainingGb} GB` : "—",
            },
            { label: "Backup Recording", value: setting!.backupRecording ? "On" : "Off" },
            { label: "Health", value: volunteerStatusLabel(setting!.status) },
          ]}
        />
      )}
      {!isEmpty ? (
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button type="button" className={TS.btnOutline} onClick={async () => {
            if (setting) await updateRecordingApi(setting.id, { recordingEnabled: true });
            else await upsertRecordingApi({ recordingEnabled: true });
            await onReload();
            onToast("success", "Recording is on.");
          }}>
            Turn On
          </button>
          <button type="button" className={TS.btnOutline} onClick={async () => {
            if (setting) { await updateRecordingApi(setting.id, { recordingEnabled: false }); await onReload(); onToast("success", "Recording is off."); }
          }}>
            Turn Off
          </button>
          <button type="button" className={TS.btnBlue} onClick={async () => {
            const r = await testRecordingApi();
            await onReload();
            onToast(r.success ? "success" : "error", r.message);
          }}>
            Test Recording
          </button>
          <button type="button" className={TS.btnOutline} onClick={() => setDeleteOpen(true)}>Delete Location</button>
        </div>
      ) : null}
      <AddEditItemModal open={modalOpen} title="Setup Recording" fields={RECORD_FIELDS} values={draft} onChange={setDraft} onSave={async () => {
        setBusy(true);
        try {
          if (setting) await updateRecordingApi(setting.id, draft as Partial<RecordingSetting>);
          else await upsertRecordingApi(draft as Partial<RecordingSetting>);
          await onReload();
          setModalOpen(false);
          onToast("success", "Recording saved.");
        } catch (err) {
          onToast("error", err instanceof Error ? err.message : "Save failed.");
        } finally {
          setBusy(false);
        }
      }} onClose={() => setModalOpen(false)} saving={busy} />
      <DeleteConfirmDialog open={deleteOpen} title="Delete Recording" message="Remove recording location?" onConfirm={async () => {
        if (!setting) return;
        setBusy(true);
        try { await deleteRecordingApi(setting.id); await onReload(); onToast("success", "Removed."); } catch (e) { onToast("error", e instanceof Error ? e.message : "Failed."); } finally { setBusy(false); setDeleteOpen(false); }
      }} onClose={() => setDeleteOpen(false)} confirming={busy} />
    </ServiceCard>
  );
}
