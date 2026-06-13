import type { ReactNode } from "react";
import Link from "next/link";

type EmailGateShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
};

export default function EmailGateShell({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Back to entry hub",
  children,
}: EmailGateShellProps) {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-brand-black px-4 pt-safe pb-safe text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,168,255,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,0,140,0.08),transparent_60%)]" />

      <div className="relative z-10 w-full max-w-lg">
        {backHref ? (
          <Link
            href={backHref}
            className="mb-4 inline-flex min-h-11 items-center font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-brand-muted transition hover:text-brand-blue"
          >
            ← {backLabel}
          </Link>
        ) : null}

        <div className="glass-panel rounded-2xl border border-brand-border p-6 shadow-[0_0_34px_rgba(0,0,0,0.45)] md:p-8">
          <header className="mb-6 text-center md:text-left">
            <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-blue">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-headline text-fluid-section uppercase tracking-[0.12em] text-white">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 font-body text-sm leading-relaxed text-brand-muted">{description}</p>
            ) : null}
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}

export function gateFieldClass(isValid: boolean, isInvalid: boolean): string {
  const base =
    "w-full rounded-xl border bg-brand-black px-4 py-3 font-body text-sm text-white transition-colors focus:outline-none focus:ring-1";

  if (isValid) {
    return `${base} border-brand-blue/60 focus:border-brand-blue focus:ring-brand-blue/40`;
  }

  if (isInvalid) {
    return `${base} border-brand-pink/60 focus:border-brand-pink focus:ring-brand-pink/40`;
  }

  return `${base} border-brand-border focus:border-brand-blue focus:ring-brand-blue/40`;
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
    <p
      className={`mt-1.5 font-ui text-[0.58rem] font-bold uppercase tracking-[0.08em] ${
        valid ? "text-brand-blue" : "text-brand-pink"
      }`}
    >
      {valid ? validMessage : invalidMessage}
    </p>
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
      className="brand-gradient-border flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-black px-6 py-3 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
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
      className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-panel px-6 py-3 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white transition hover:border-brand-blue/40 active:scale-[0.99] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
