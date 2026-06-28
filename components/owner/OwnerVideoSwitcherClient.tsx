"use client";

import { useCallback, useState } from "react";
import VideoSwitcherRoom from "@/components/owner/VideoSwitcherRoom";
import { useOwnerBroadcastSnapshot } from "@/hooks/useOwnerBroadcastSnapshot";

export default function OwnerVideoSwitcherClient() {
  const { snapshot, loading, error, reload, setSnapshot } = useOwnerBroadcastSnapshot();
  const [commandPending, setCommandPending] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleSendVmixCommand = useCallback(
    async (command: string, inputId: number) => {
      setCommandPending(true);
      setActionMessage(null);
      try {
        const query = command === "PreviewInput" && inputId > 0 ? { Input: String(inputId) } : {};
        const response = await fetch("/api/owner/vmix/command", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ function: command, query }),
        });
        const data = (await response.json()) as {
          vmix?: typeof snapshot.vmix;
          message?: string;
          ok?: boolean;
          error?: string;
        };
        if (data.vmix) {
          setSnapshot((prev) => ({ ...prev, vmix: data.vmix ?? prev.vmix }));
        } else {
          await reload(true);
        }
        setActionMessage(
          data.message ?? data.error ?? (data.ok ? `${command} sent.` : "vMix command failed."),
        );
      } catch {
        setActionMessage("vMix command request failed.");
      } finally {
        setCommandPending(false);
      }
    },
    [reload, setSnapshot],
  );

  const previewInput = snapshot.vmix?.previewInput ?? 0;
  const programInput = snapshot.vmix?.activeInput ?? 0;

  return (
    <div>
      {error ? (
        <div className="mx-4 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-200 sm:mx-6">
          {error}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="mx-4 mt-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 font-body text-sm text-slate-200 sm:mx-6">
          {actionMessage}
        </div>
      ) : null}
      {loading && !snapshot.capturedAt ? (
        <p className="p-6 font-body text-sm text-slate-500">Loading vMix snapshot…</p>
      ) : (
        <VideoSwitcherRoom
          activePreviewInput={previewInput}
          activeProgramInput={programInput}
          commandPending={commandPending}
          onSendVmixCommand={handleSendVmixCommand}
        />
      )}
    </div>
  );
}
