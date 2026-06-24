"use client";

import { ShieldAlert } from "lucide-react";
import type { UserRole } from "@/lib/broadcast/countdown-console-types";

type PermissionsPanelProps = {
  role: UserRole;
};

export default function PermissionsPanel({ role }: PermissionsPanelProps) {
  const isPrivileged = role === "admin" || role === "producer";

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
        {isPrivileged
          ? "You have full access to edit and launch."
          : role === "viewer"
            ? "View-only access — editor controls are hidden."
            : "Read-only mode. You can monitor, but cannot save or launch."}
      </p>
    </section>
  );
}
