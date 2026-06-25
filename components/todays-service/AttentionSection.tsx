"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import AddEditItemModal from "@/components/todays-service/AddEditItemModal";
import { FooterLink, ServiceCard, TS } from "@/components/todays-service/ServiceUi";
import { fixAlertApi, ignoreAlertApi, noteAlertApi } from "@/lib/todays-service/api";
import type { ServiceAlert } from "@/lib/todays-service/types";

type AttentionSectionProps = {
  alerts: ServiceAlert[];
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
  onFixIssues: () => void;
};

export default function AttentionSection({ alerts, onReload, onToast, onFixIssues }: AttentionSectionProps) {
  const openAlerts = alerts.filter((a) => a.status === "open");
  const [noteAlert, setNoteAlert] = useState<ServiceAlert | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, unknown>>({ note: "" });
  const [busy, setBusy] = useState(false);

  return (
    <ServiceCard
      title="Things That Need Attention"
      action={<AlertTriangle className="h-4 w-4 text-yellow-300" aria-hidden="true" />}
    >
      {openAlerts.length === 0 ? (
        <p className="font-body text-sm text-[#53fc18]">Great news! Everything is ready for today&apos;s service.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {openAlerts.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-lg border px-3 py-2.5 ${
                alert.severity === "critical"
                  ? "border-red-500/30 bg-red-950/20"
                  : "border-yellow-500/30 bg-yellow-950/15"
              }`}
            >
              <p className="font-body text-[0.82rem] text-white">{alert.message}</p>
              {alert.note ? <p className="mt-1 text-xs text-neutral-400">Note: {alert.note}</p> : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" onClick={onFixIssues} className={TS.btnPrimary}>
                  Fix Now
                </button>
                <button type="button" className={TS.btnOutline} onClick={async () => {
                  await ignoreAlertApi(alert.id);
                  await onReload();
                  onToast("success", "Ignored for today.");
                }}>
                  Ignore
                </button>
                <button type="button" className={TS.btnOutline} onClick={() => { setNoteAlert(alert); setNoteDraft({ note: alert.note }); }}>
                  Note
                </button>
                <button type="button" className={TS.btnOutline} onClick={async () => {
                  await fixAlertApi(alert.id);
                  await onReload();
                  onToast("success", "Marked fixed.");
                }}>
                  Mark Fixed
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <FooterLink>View All Alerts</FooterLink>
      <AddEditItemModal
        open={Boolean(noteAlert)}
        title="Add Note"
        fields={[{ key: "note", label: "Note", type: "textarea", required: true }]}
        values={noteDraft}
        onChange={setNoteDraft}
        onSave={async () => {
          const note = String(noteDraft.note ?? "");
          if (!noteAlert || !note.trim()) { onToast("error", "Note required."); return; }
          setBusy(true);
          try {
            await noteAlertApi(noteAlert.id, note);
            await onReload();
            setNoteAlert(null);
            onToast("success", "Note saved.");
          } catch (err) {
            onToast("error", err instanceof Error ? err.message : "Save failed.");
          } finally {
            setBusy(false);
          }
        }}
        onClose={() => setNoteAlert(null)}
        saving={busy}
        saveLabel="Save Note"
      />
    </ServiceCard>
  );
}
