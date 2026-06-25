"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { FormField } from "@/components/todays-service/AddEditItemModal";
import DeleteConfirmDialog from "@/components/todays-service/DeleteConfirmDialog";
import { IconBtn, ServiceCard, TS } from "@/components/todays-service/ServiceUi";
import { Pencil, Trash2 } from "lucide-react";
import { createTeamMemberApi, deleteTeamMemberApi, updateTeamMemberApi } from "@/lib/todays-service/api";
import type { TeamMember, TeamRoleKey } from "@/lib/todays-service/types";

const AddEditItemModal = dynamic(() => import("@/components/todays-service/AddEditItemModal"), {
  ssr: false,
});

type TeamSectionProps = {
  members: TeamMember[];
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

const TEAM_FIELDS: FormField[] = [
  { key: "name", label: "Name", required: true },
  {
    key: "roleKey",
    label: "Role",
    type: "select",
    required: true,
    options: [
      { value: "producer", label: "Producer" },
      { value: "sound", label: "Sound" },
      { value: "cameras", label: "Cameras" },
      { value: "slides", label: "Slides" },
      { value: "pastor", label: "Pastor" },
      { value: "volunteer", label: "Volunteer" },
    ],
  },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
];

const ROLE_LABELS: Record<TeamRoleKey, string> = {
  producer: "Producer",
  sound: "Sound",
  cameras: "Cameras",
  slides: "Slides",
  pastor: "Pastor",
  volunteer: "Volunteer",
};

export default function TeamSection({ members, onReload, onToast }: TeamSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<TeamMember | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);

  return (
    <ServiceCard title="Today's Team" action={<button type="button" onClick={() => { setEditItem(null); setDraft({ name: "", roleKey: "volunteer", email: "", phone: "" }); setModalOpen(true); }} className={TS.link}>Add Team Member</button>}>
      <p className="font-ui text-[0.48rem] uppercase tracking-[0.1em] text-white/40">Optional — not required to go live</p>
      {members.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between rounded-lg border border-white/8 bg-black/50 px-3 py-2">
              <div>
                <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em] text-[#53fc18]">{ROLE_LABELS[member.roleKey]}</p>
                <p className="font-body text-[0.82rem] text-white">{member.name}</p>
              </div>
              <div className="flex gap-1">
                <IconBtn icon={Pencil} label="Edit" onClick={() => { setEditItem(member); setDraft({ name: member.name, roleKey: member.roleKey, email: member.email, phone: member.phone }); setModalOpen(true); }} />
                <IconBtn icon={Trash2} label="Delete" onClick={() => setDeleteId(member.id)} danger />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={TS.muted} role="status">
          No team members yet.
        </p>
      )}
      <button type="button" className={`mt-3 ${TS.btnBlue}`} onClick={() => onToast("success", "Team saved.")}>Save Team</button>
      <AddEditItemModal open={modalOpen} title={editItem ? "Edit Member" : "Add Team Member"} fields={TEAM_FIELDS} values={draft} onChange={setDraft} onSave={async () => {
        if (!String(draft.name ?? "").trim()) { onToast("error", "Name required."); return; }
        setBusy(true);
        try {
          if (editItem) await updateTeamMemberApi(editItem.id, draft as Partial<TeamMember>);
          else await createTeamMemberApi(draft as Partial<TeamMember>);
          await onReload();
          setModalOpen(false);
          onToast("success", "Saved.");
        } catch (err) {
          onToast("error", err instanceof Error ? err.message : "Save failed.");
        } finally {
          setBusy(false);
        }
      }} onClose={() => setModalOpen(false)} saving={busy} />
      <DeleteConfirmDialog open={Boolean(deleteId)} title="Remove Member" message="Remove from today's team?" onConfirm={async () => {
        if (!deleteId) return;
        setBusy(true);
        try { await deleteTeamMemberApi(deleteId); await onReload(); onToast("success", "Removed."); } catch (e) { onToast("error", e instanceof Error ? e.message : "Failed."); } finally { setBusy(false); setDeleteId(null); }
      }} onClose={() => setDeleteId(null)} confirming={busy} />
    </ServiceCard>
  );
}
