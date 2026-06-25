"use client";

import {
  GripVertical,
  Pencil,
  Play,
  Trash2,
  Zap,
  Eye,
  type LucideIcon,
} from "lucide-react";
import { PARABLE_COLORS, PARABLE_SHELL, PARABLE_STATUS } from "@/lib/broadcast/parable-tokens";
import type { ReadinessStatus, UploadStrength } from "@/lib/todays-service/types";
import { statusLabel } from "@/lib/todays-service/types";

export const TS = {
  page: PARABLE_SHELL.page,
  sidebar: "flex w-[220px] shrink-0 flex-col border-r border-white/10 bg-black",
  sidebarActive: "border-l-2 border-l-[#53fc18] bg-[#53fc18]/12 text-white",
  sidebarLink:
    "flex items-center gap-2.5 px-4 py-2.5 font-ui text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-neutral-400 transition hover:bg-white/5 hover:text-white",
  main: "flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto",
  content: "flex flex-col gap-4 p-4 pb-28 lg:p-5",
  panel: `${PARABLE_SHELL.panel} shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]`,
  panelHeader: "flex items-center justify-between gap-2 border-b border-white/8 pb-3",
  panelTitle: "font-ui text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/90",
  muted: "font-body text-sm text-neutral-400",
  labelMuted: "font-ui text-[0.52rem] font-bold uppercase tracking-[0.12em] text-neutral-400",
  captionMuted: "font-ui text-[0.48rem] uppercase tracking-[0.08em] text-zinc-400",
  secondaryMuted: "font-ui text-[0.55rem] uppercase tracking-[0.1em] text-neutral-400",
  input: PARABLE_SHELL.input,
  link: PARABLE_SHELL.link,
  btnOutline:
    "touch-target inline-flex items-center justify-center gap-1.5 rounded-md border border-white/15 bg-transparent px-3 py-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] text-white/80 transition hover:border-white/25 hover:bg-white/5",
  btnPrimary:
    "touch-target inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] " +
    PARABLE_SHELL.btnGreen,
  btnCyan:
    "touch-target inline-flex items-center gap-1.5 rounded-lg border border-[#00f2ff]/30 px-3 py-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] " +
    PARABLE_SHELL.btnSecondary,
  btnBlue:
    "touch-target inline-flex items-center gap-1.5 rounded-lg border border-[#00f2ff]/30 px-3 py-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] text-[#00f2ff] bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20",
  btnGreen:
    "touch-target inline-flex items-center gap-1.5 rounded-md border border-[#53fc18]/40 bg-[#53fc18]/15 px-3 py-1.5 font-ui text-[0.55rem] font-bold uppercase tracking-[0.08em] text-[#53fc18] hover:bg-[#53fc18]/25",
  addBtn:
    "touch-target inline-flex items-center gap-1 rounded-md border border-[#00f2ff]/35 bg-[#00f2ff]/10 px-2.5 py-1 font-ui text-[0.52rem] font-bold uppercase tracking-[0.08em] text-[#00f2ff] hover:bg-[#00f2ff]/20",
} as const;

export function readinessUi(status: ReadinessStatus | UploadStrength) {
  switch (status) {
    case "ready":
    case "excellent":
      return PARABLE_STATUS.green;
    case "good":
      return PARABLE_STATUS.yellow;
    case "needs_attention":
      return PARABLE_STATUS.yellow;
    case "not_connected":
      return PARABLE_STATUS.red;
    default:
      return { text: "text-neutral-400", border: "border-white/10", bg: "bg-white/5", dot: "bg-neutral-500" };
  }
}

export function readinessText(status: ReadinessStatus | UploadStrength): string {
  switch (status) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Looking Good";
    case "needs_attention":
      return "Let's Finish Setup";
    case "not_connected":
      return "Not Connected Yet";
    case "ready":
      return "Ready to Go";
    default:
      return "Setup Needed";
  }
}

export function ServiceCard({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${TS.panel} flex flex-col rounded-xl p-4 ${className}`}>
      <div className={TS.panelHeader}>
        <h2 className={TS.panelTitle}>{title}</h2>
        {action}
      </div>
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">{children}</div>
    </section>
  );
}

export function StatusDot({ status }: { status: ReadinessStatus | UploadStrength | "connected" | "healthy" }) {
  const ui =
    status === "connected" || status === "healthy" || status === "ready" || status === "excellent"
      ? PARABLE_STATUS.green
      : status === "good"
        ? PARABLE_STATUS.yellow
        : readinessUi(status as ReadinessStatus);
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${ui.dot}`} aria-hidden="true" />;
}

export function RowItem({
  title,
  subtitle,
  statusText,
  statusKind = "ready",
  onEdit,
  onDelete,
  onTest,
  onPreview,
  testLabel,
}: {
  title: string;
  subtitle?: string;
  statusText?: string;
  statusKind?: ReadinessStatus | "healthy" | "connected";
  onEdit?: () => void;
  onDelete?: () => void;
  onTest?: () => void;
  onPreview?: () => void;
  testLabel?: string;
}) {
  const ui = statusKind === "healthy" || statusKind === "connected" ? PARABLE_STATUS.green : readinessUi(statusKind);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/60 px-2.5 py-2">
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-white/20" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-[0.82rem] text-white">{title}</p>
        {subtitle ? <p className={`truncate ${TS.captionMuted} tracking-[0.06em]`}>{subtitle}</p> : null}
      </div>
      {statusText ? (
        <span className={`shrink-0 font-ui text-[0.52rem] font-bold uppercase tracking-[0.06em] ${ui.text}`}>
          {statusText}
        </span>
      ) : null}
      <div className="flex shrink-0 items-center gap-0.5">
        {onEdit ? <IconBtn icon={Pencil} label="Edit" onClick={onEdit} /> : null}
        {onPreview ? <IconBtn icon={Eye} label="Preview" onClick={onPreview} /> : null}
        {onTest ? <IconBtn icon={Zap} label={testLabel ?? "Test"} onClick={onTest} /> : null}
        {onDelete ? <IconBtn icon={Trash2} label="Delete" onClick={onDelete} danger /> : null}
      </div>
    </div>
  );
}

export function IconBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => void onClick()}
      className={`touch-target rounded p-1.5 transition hover:bg-white/10 ${danger ? "text-red-400" : "text-white/55 hover:text-white"}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

export function FooterLink({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`mt-auto pt-2 text-left ${TS.link}`}>
      {children}
    </button>
  );
}

export function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className={TS.labelMuted}>{children}</p>;
}

export function MetaGrid({ items }: { items: { label: string; value: string; highlight?: boolean }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <dt className={`${TS.captionMuted} tracking-[0.08em]`}>{item.label}</dt>
          <dd
            className={`font-body text-[0.8rem] ${item.highlight ? "text-[#53fc18]" : "text-white/90"}`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function StopServiceButton({ onClick, compact }: { onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        compact
          ? "touch-target inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-600/20 px-3 py-1.5 font-ui text-[0.52rem] font-bold uppercase tracking-[0.1em] text-red-200"
          : "touch-target inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-600/20 px-4 py-2 font-ui text-[0.58rem] font-bold uppercase tracking-[0.1em] text-red-200"
      }
    >
      Stop Service
    </button>
  );
}

export function BeginServiceButton({
  onClick,
  sublabel,
  compact,
}: {
  onClick: () => void;
  sublabel?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={onClick} className={compact ? `${TS.btnPrimary} px-3 py-1.5 text-[0.52rem]` : TS.btnPrimary}>
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        Begin Service
      </button>
      {sublabel ? <span className={TS.captionMuted}>{sublabel}</span> : null}
    </div>
  );
}

export { PARABLE_COLORS };
