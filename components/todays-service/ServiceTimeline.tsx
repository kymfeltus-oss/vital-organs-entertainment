"use client";

import { useState } from "react";
import AddEditItemModal, { type FormField } from "@/components/todays-service/AddEditItemModal";
import DeleteConfirmDialog from "@/components/todays-service/DeleteConfirmDialog";
import { IconBtn, ServiceCard, TS } from "@/components/todays-service/ServiceUi";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import {
  createTimelineApi,
  deleteTimelineApi,
  reorderTimelineApi,
  updateTimelineApi,
} from "@/lib/todays-service/api";
import type { ServiceTimelineItem } from "@/lib/todays-service/types";

type ServiceTimelineProps = {
  items: ServiceTimelineItem[];
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

const TIMELINE_FIELDS: FormField[] = [
  { key: "label", label: "Service Part Name", required: true },
  { key: "durationMinutes", label: "Duration (minutes)", type: "number" },
];

function formatTime(item: ServiceTimelineItem, index: number, items: ServiceTimelineItem[]): string {
  if (index === 0) return "10:00 AM";
  return `${10 + index}:${index % 2 === 0 ? "30" : "00"} AM`;
}

export default function ServiceTimeline({ items, onReload, onToast }: ServiceTimelineProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ServiceTimelineItem | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const ordered = [...items];
    const [removed] = ordered.splice(index, 1);
    ordered.splice(target, 0, removed);
    await reorderTimelineApi(ordered.map((i) => i.id));
    await onReload();
    onToast("success", "Timeline updated.");
  };

  return (
    <ServiceCard title="Service Timeline" action={<button type="button" onClick={() => { setEditItem(null); setDraft({ label: "", durationMinutes: "" }); setModalOpen(true); }} className={TS.addBtn}>+ Add Part</button>}>
      <p className="font-ui text-[0.48rem] uppercase tracking-[0.1em] text-white/40">Optional — not required to go live</p>
      {items.length > 0 ? (
        <ol className="flex flex-col gap-1">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/50 px-2 py-2">
              <span className="w-16 shrink-0 font-ui text-[0.52rem] font-bold uppercase text-[#00f2ff]">{formatTime(item, index, items)}</span>
              <span className="min-w-0 flex-1 truncate font-body text-[0.82rem] text-white">{item.label}</span>
              <IconBtn icon={ChevronUp} label="Move up" onClick={() => void move(index, -1)} />
              <IconBtn icon={ChevronDown} label="Move down" onClick={() => void move(index, 1)} />
              <IconBtn icon={Pencil} label="Edit" onClick={() => { setEditItem(item); setDraft({ label: item.label, durationMinutes: item.durationMinutes ?? "" }); setModalOpen(true); }} />
              <IconBtn icon={Trash2} label="Delete" onClick={() => setDeleteId(item.id)} danger />
            </li>
          ))}
        </ol>
      ) : (
        <p className={TS.muted}>No timeline parts yet.</p>
      )}
      <button type="button" className={`mt-3 ${TS.btnBlue}`} onClick={() => onToast("success", "Timeline saved.")}>Save Timeline</button>
      <AddEditItemModal open={modalOpen} title={editItem ? "Edit Part" : "Add Part"} fields={TIMELINE_FIELDS} values={draft} onChange={setDraft} onSave={async () => {
        if (!String(draft.label ?? "").trim()) { onToast("error", "Name required."); return; }
        setBusy(true);
        try {
          const duration = draft.durationMinutes === "" || draft.durationMinutes == null ? null : Number(draft.durationMinutes);
          if (editItem) await updateTimelineApi(editItem.id, { label: String(draft.label), durationMinutes: duration });
          else await createTimelineApi({ label: String(draft.label), durationMinutes: duration });
          await onReload();
          setModalOpen(false);
          onToast("success", "Saved.");
        } catch (err) {
          onToast("error", err instanceof Error ? err.message : "Save failed.");
        } finally {
          setBusy(false);
        }
      }} onClose={() => setModalOpen(false)} saving={busy} />
      <DeleteConfirmDialog open={Boolean(deleteId)} title="Delete Part" message="Remove this part?" onConfirm={async () => {
        if (!deleteId) return;
        setBusy(true);
        try { await deleteTimelineApi(deleteId); await onReload(); onToast("success", "Removed."); } catch (e) { onToast("error", e instanceof Error ? e.message : "Failed."); } finally { setBusy(false); setDeleteId(null); }
      }} onClose={() => setDeleteId(null)} confirming={busy} />
    </ServiceCard>
  );
}
