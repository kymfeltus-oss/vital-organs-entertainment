"use client";

import { ShieldAlert } from "lucide-react";
import type { UserRole } from "@/lib/broadcast/countdown-console-types";

type PermissionsPanelProps = {
  role: UserRole;
};

function roleDescription(role: UserRole): string {
  if (role === "admin" || role === "producer") {
    return "You have full access to edit and launch.";
  }
  if (role === "broadcast_operator") {
    return "Monitor-only mode. You can watch telemetry and chat, but cannot save or go live.";
  }
  if (role === "camera_crew") {
    return "Camera crew access. Countdown editor controls are read-only on this console.";
  }
  if (role === "prayer_team") {
    return "Prayer team access. Countdown editor controls are read-only on this console.";
  }
  return "Read-only access — editor controls are disabled.";
}

export default function PermissionsPanel({ role }: PermissionsPanelProps) {
  return (
    <section className="glass-panel rounded-2xl border border-brand-border p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-brand-pink" aria-hidden="true" />
        <h2 className="font-ui text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white">
          Permissions
        </h2>
      </div>

      <p className="font-body text-sm text-white">
        Your Role:{" "}
        <span className="font-semibold text-brand-blue">{role.replace(/_/g, " ")}</span>
      </p>

      <p className="mt-2 font-body text-sm leading-relaxed text-brand-muted">
        {roleDescription(role)}
      </p>
    </section>
  );
}
