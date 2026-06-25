"use client";

import { Check } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { FormField } from "@/components/todays-service/AddEditItemModal";
import DeleteConfirmDialog from "@/components/todays-service/DeleteConfirmDialog";
import GuidedEmptyState from "@/components/todays-service/GuidedEmptyState";
import { ServiceCard, TS } from "@/components/todays-service/ServiceUi";
import {
  deletePresentationApi,
  testPresentationApi,
  upsertPresentationApi,
} from "@/lib/todays-service/api";
import type { PresentationSource } from "@/lib/todays-service/types";

const AddEditItemModal = dynamic(() => import("@/components/todays-service/AddEditItemModal"), {
  ssr: false,
});

type PresentationSectionProps = {
  sources: PresentationSource[];
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

const PRESENTATION_FIELDS: FormField[] = [
  {
    key: "softwareName",
    label: "Presentation Software",
    type: "select",
    required: true,
    options: [
      { value: "ProPresenter", label: "ProPresenter" },
      { value: "PowerPoint", label: "PowerPoint" },
      { value: "Keynote", label: "Keynote" },
      { value: "None", label: "None" },
    ],
  },
  { key: "lyricsLoaded", label: "Lyrics Loaded", type: "checkbox" },
  { key: "slidesLoaded", label: "Slides Loaded", type: "checkbox" },
  { key: "lowerThirdsEnabled", label: "Lower Thirds Enabled", type: "checkbox" },
];

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/8 bg-black/40 px-3 py-2">
      <span className="font-body text-[0.8rem] text-white/80">{label}</span>
      <span className={`flex items-center gap-1 font-ui text-[0.52rem] font-bold uppercase ${ok ? "text-green-400" : "text-neutral-400"}`}>
        {ok ? <Check className="h-3.5 w-3.5" /> : null}
        {ok ? "Ready to Go" : "Not loaded yet"}
      </span>
    </div>
  );
}

export default function PresentationSection({ sources, onReload, onToast }: PresentationSectionProps) {
  const source = sources[0];
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const isEmpty = !source || source.softwareName === "None" || source.connectionStatus !== "connected";

  const openSetup = () => {
    setDraft({
      softwareName: source?.softwareName && source.softwareName !== "None" ? source.softwareName : "ProPresenter",
      lyricsLoaded: source?.lyricsLoaded ?? false,
      slidesLoaded: source?.slidesLoaded ?? false,
      lowerThirdsEnabled: source?.lowerThirdsEnabled ?? false,
    });
    setModalOpen(true);
  };

  return (
    <ServiceCard
      title="Presentation"
      action={!isEmpty ? <button type="button" onClick={openSetup} className={TS.link}>View Presentation</button> : null}
    >
      {isEmpty ? (
        <GuidedEmptyState
          title="Connect your presentation software to display lyrics and slides."
          intro="Works with popular apps like:"
          bullets={["ProPresenter", "PowerPoint", "Keynote"]}
          actionLabel="Connect Presentation"
          onAction={openSetup}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="font-body text-sm text-white">{source!.softwareName}</p>
            <span className="font-ui text-[0.52rem] font-bold uppercase text-green-400">Ready to Go</span>
          </div>
          <CheckRow label="Lyrics Loaded" ok={source!.lyricsLoaded} />
          <CheckRow label="Slides Loaded" ok={source!.slidesLoaded} />
          <CheckRow label="Lower Thirds" ok={source!.lowerThirdsEnabled} />
        </>
      )}
      {!isEmpty ? (
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button type="button" className={TS.btnBlue} onClick={async () => {
            await upsertPresentationApi({ id: source?.id, softwareName: source?.softwareName ?? "ProPresenter", connectionStatus: "connected", status: "ready" });
            await onReload();
            onToast("success", "Connected.");
          }}>Connect Presentation</button>
          {source ? (
            <button type="button" className={TS.btnOutline} onClick={async () => {
              const r = await testPresentationApi(source.id);
              await onReload();
              onToast(r.success ? "success" : "error", r.message);
            }}>Test Presentation</button>
          ) : null}
          <button type="button" className={TS.btnOutline} onClick={() => setDeleteOpen(true)}>Delete</button>
        </div>
      ) : null}
      <AddEditItemModal open={modalOpen} title="Connect Presentation" fields={PRESENTATION_FIELDS} values={draft} onChange={setDraft} onSave={async () => {
        setBusy(true);
        try {
          await upsertPresentationApi({ id: source?.id, ...(draft as Partial<PresentationSource>), connectionStatus: draft.softwareName === "None" ? "not_connected" : "connected" });
          await onReload();
          setModalOpen(false);
          onToast("success", "Saved.");
        } catch (err) {
          onToast("error", err instanceof Error ? err.message : "Save failed.");
        } finally {
          setBusy(false);
        }
      }} onClose={() => setModalOpen(false)} saving={busy} />
      <DeleteConfirmDialog open={deleteOpen} title="Delete Presentation" message="Remove presentation source?" onConfirm={async () => {
        if (!source) return;
        setBusy(true);
        try { await deletePresentationApi(source.id); await onReload(); onToast("success", "Removed."); } catch (e) { onToast("error", e instanceof Error ? e.message : "Failed."); } finally { setBusy(false); setDeleteOpen(false); }
      }} onClose={() => setDeleteOpen(false)} confirming={busy} />
    </ServiceCard>
  );
}
