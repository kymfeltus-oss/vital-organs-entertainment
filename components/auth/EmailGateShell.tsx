import type { ReactNode } from "react";
import Link from "next/link";

type EmailGateShellProps = {
  /** Reserved for future PNG-backed auth art — not rendered until assets land. */
  eyebrow?: string;
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
};

/** Minimal auth canvas — OLED black, ready for PNG overlay wiring. */
export default function EmailGateShell({
  backHref,
  backLabel = "Back",
  children,
}: EmailGateShellProps) {
  return (
    <main className="relative flex min-h-dvh w-full flex-col bg-brand-black pt-safe pb-safe text-white">
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-4">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-4 inline-flex min-h-11 items-center font-ui text-xs text-brand-muted underline-offset-2 hover:underline"
          >
            ← {backLabel}
          </Link>
        ) : null}

        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </main>
  );
}

export function gateFieldClass(_isValid: boolean, _isInvalid: boolean): string {
  return "w-full min-h-11 rounded-lg border border-brand-border bg-brand-black px-3 py-2 font-body text-sm text-white outline-none focus:border-brand-blue";
}

export function ValidationHint({
  valid,
  invalid,
  validMessage,
  invalidMessage,
}: {
  valid: boolean;
  invalid: boolean;
  validMessage: string;
  invalidMessage: string;
}) {
  if (!valid && !invalid) return null;

  return (
    <p className="mt-1 font-body text-xs text-brand-muted">{valid ? validMessage : invalidMessage}</p>
  );
}

export function PrimaryGateButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-border bg-brand-panel px-4 py-2 font-ui text-sm text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SecondaryGateButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-border bg-transparent px-4 py-2 font-ui text-sm text-brand-muted disabled:opacity-50"
    >
      {children}
    </button>
  );
}
