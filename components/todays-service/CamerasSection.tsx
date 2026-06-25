"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import DeleteConfirmDialog from "@/components/todays-service/DeleteConfirmDialog";
import GuidedEmptyState from "@/components/todays-service/GuidedEmptyState";
import { FooterLink, IconBtn, ServiceCard, TS } from "@/components/todays-service/ServiceUi";
import { useAccessibleModal } from "@/components/todays-service/useAccessibleModal";
import { Eye, Pencil, Trash2, Zap } from "lucide-react";
import {
  deleteCameraAccountApi,
  previewCameraAccountApi,
  testCameraAccountApi,
  updateCameraAccountApi,
} from "@/lib/cameras/api";
import { volunteerStatusLabel } from "@/lib/todays-service/coaching";
import type { Camera } from "@/lib/todays-service/types";

const CameraSetupWizard = dynamic(() => import("@/components/todays-service/CameraSetupWizard"), {
  ssr: false,
});

type CamerasSectionProps = {
  cameras: Camera[];
  setupTrigger?: number;
  onReload: () => Promise<unknown>;
  onToast: (type: "success" | "error", message: string) => void;
};

const LIVE_LABELS: Record<string, string> = {
  offline: "Offline",
  connecting: "Connecting…",
  connected: "Connected",
  previewing: "Previewing",
  testing: "Testing…",
  needs_attention: "Needs Attention",
};

export default function CamerasSection({ cameras, setupTrigger = 0, onReload, onToast }: CamerasSectionProps) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Camera | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDeviceId, setPreviewDeviceId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const editOpen = Boolean(editItem);
  const { titleId: editTitleId, panelRef: editPanelRef, dialogProps: editDialogProps } = useAccessibleModal(
    editOpen,
    () => setEditItem(null),
  );
  const { titleId: previewTitleId, panelRef: previewPanelRef, dialogProps: previewDialogProps } = useAccessibleModal(
    previewOpen,
    () => setPreviewOpen(false),
  );

  const openAdd = useCallback(() => setWizardOpen(true), []);

  useEffect(() => {
    if (setupTrigger > 0) openAdd();
  }, [setupTrigger, openAdd]);

  useEffect(() => {
    if (!previewOpen || !previewDeviceId) return;
    let stream: MediaStream | null = null;
    void navigator.mediaDevices
      .getUserMedia({ video: { deviceId: { exact: previewDeviceId } } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play();
        }
      })
      .catch((err) => onToast("error", err instanceof Error ? err.message : "Preview failed."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [previewOpen, previewDeviceId, onToast]);

  const runTest = async (camera: Camera) => {
    setBusy(true);
    try {
      let clientVerified = false;
      if (camera.previewSource.startsWith("browser://")) {
        const deviceId = camera.previewSource.replace("browser://", "");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
          stream.getTracks().forEach((t) => t.stop());
          clientVerified = true;
        } catch (err) {
          onToast("error", err instanceof Error ? err.message : "Camera test failed.");
          return;
        }
      }
      const result = await testCameraAccountApi(camera.id, clientVerified);
      await onReload();
      onToast(result.success ? "success" : "error", result.message);
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  };

  const runPreview = async (camera: Camera) => {
    try {
      const result = await previewCameraAccountApi(camera.id);
      if (!result.success) {
        onToast("error", result.message);
        return;
      }
      if (result.previewMode === "browser" && result.deviceId) {
        setPreviewDeviceId(result.deviceId);
        setPreviewOpen(true);
      } else if (result.previewMode === "network" && result.networkUrl) {
        onToast("success", `Network camera: ${result.networkUrl}`);
      } else {
        onToast("success", result.message);
      }
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Preview failed.");
    }
  };

  const saveEdit = async () => {
    if (!editItem) return;
    setBusy(true);
    try {
      await updateCameraAccountApi(editItem.id, {
        name: editItem.name,
        location: editItem.location,
        cameraType: editItem.cameraType,
      });
      await onReload();
      setEditItem(null);
      onToast("success", "Camera updated.");
    } catch (err) {
      onToast("error", err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ServiceCard
        title="Cameras"
        action={cameras.length > 0 ? <button type="button" onClick={openAdd} className={TS.addBtn}>+ Add Camera</button> : null}
      >
        {cameras.length === 0 ? (
          <GuidedEmptyState
            title="Let's connect your cameras."
            intro="We'll help you:"
            bullets={["Find USB and capture devices", "Scan network cameras", "Test live preview"]}
            actionLabel="Connect Cameras"
            onAction={openAdd}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            {cameras.map((camera) => (
              <div key={camera.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/8 bg-black/60 px-2 py-2">
                <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded border border-white/10 bg-[#111111] font-ui text-[0.42rem] uppercase text-white/45">
                  {LIVE_LABELS[camera.liveStatus] ?? camera.status}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[0.82rem] text-white">{camera.name}</p>
                  <p className="truncate font-ui text-[0.48rem] uppercase text-white/40">
                    {camera.location || camera.connectionType} · {camera.hardwareLabel ?? camera.cameraType}
                  </p>
                </div>
                <span className="font-ui text-[0.52rem] font-bold uppercase text-green-400">
                  {volunteerStatusLabel(camera.status)}
                </span>
                <IconBtn icon={Pencil} label="Edit" onClick={() => setEditItem(camera)} />
                <IconBtn icon={Eye} label="Preview" onClick={() => void runPreview(camera)} />
                <IconBtn icon={Zap} label="Test" onClick={() => void runTest(camera)} />
                <IconBtn icon={Trash2} label="Delete" onClick={() => setDeleteId(camera.id)} danger />
              </div>
            ))}
          </div>
        )}
        <FooterLink>View Cameras</FooterLink>
      </ServiceCard>

      <CameraSetupWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onSaved={onReload} onToast={onToast} />

      {editItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div ref={editPanelRef} {...editDialogProps} className={`${TS.panel} w-full max-w-md rounded-xl p-5`}>
            <h2 id={editTitleId} className="font-headline text-lg uppercase text-white">
              Edit Camera
            </h2>
            <div className="mt-4 space-y-3">
              <label htmlFor="edit-camera-name" className="block">
                <span className={`mb-1 block ${TS.labelMuted} tracking-[0.08em]`}>Name</span>
                <input
                  id="edit-camera-name"
                  className={TS.input}
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                />
              </label>
              <label htmlFor="edit-camera-location" className="block">
                <span className={`mb-1 block ${TS.labelMuted} tracking-[0.08em]`}>Location</span>
                <input
                  id="edit-camera-location"
                  className={TS.input}
                  value={editItem.location}
                  onChange={(e) => setEditItem({ ...editItem, location: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={busy} onClick={() => void saveEdit()} className={TS.btnPrimary}>
                Save
              </button>
              <button type="button" onClick={() => setEditItem(null)} className={TS.btnOutline}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div ref={previewPanelRef} {...previewDialogProps} className={`${TS.panel} w-full max-w-lg rounded-xl p-4`}>
            <h2 id={previewTitleId} className="font-headline text-lg uppercase text-white">
              Camera Preview
            </h2>
            <video ref={videoRef} className="mt-3 aspect-video w-full rounded-lg bg-black object-cover" playsInline muted autoPlay />
            <button type="button" className={`${TS.btnOutline} mt-3`} onClick={() => setPreviewOpen(false)}>
              Close Preview
            </button>
          </div>
        </div>
      ) : null}

      <DeleteConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Camera"
        message="Remove this camera from today's service?"
        onConfirm={async () => {
          if (!deleteId) return;
          setBusy(true);
          try {
            await deleteCameraAccountApi(deleteId);
            await onReload();
            onToast("success", "Camera deleted.");
          } catch (e) {
            onToast("error", e instanceof Error ? e.message : "Delete failed.");
          } finally {
            setBusy(false);
            setDeleteId(null);
          }
        }}
        onClose={() => setDeleteId(null)}
        confirming={busy}
      />
    </>
  );
}
