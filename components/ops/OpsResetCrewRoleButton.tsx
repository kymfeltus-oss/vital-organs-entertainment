"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OPS_HOME_PATH } from "@/lib/broadcastRoutes";

type OpsResetCrewRoleButtonProps = {
  targetRole?: "admin" | "producer";
  label?: string;
};

export default function OpsResetCrewRoleButton({
  targetRole = "admin",
  label = "Switch to Admin Role",
}: OpsResetCrewRoleButtonProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/ops/crew-role", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
        cache: "no-store",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to update crew role.");
      }

      router.replace(OPS_HOME_PATH);
      router.refresh();
    } catch (resetError) {
      setError(
        resetError instanceof Error ? resetError.message : "Unable to update crew role.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void handleReset()}
        disabled={isSaving}
        className="inline-flex min-h-11 items-center rounded-full border border-brand-purple/50 bg-brand-purple/10 px-6 font-ui text-[0.62rem] font-bold uppercase tracking-[0.14em] text-brand-purple transition hover:bg-brand-purple/20 disabled:opacity-60"
      >
        {isSaving ? "Updating…" : label}
      </button>
      {error ? <p className="font-body text-xs text-brand-pink">{error}</p> : null}
    </div>
  );
}
