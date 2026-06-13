import Link from "next/link";
import type { ReactNode } from "react";

type OpsModuleShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export default function OpsModuleShell({
  eyebrow,
  title,
  description,
  children,
}: OpsModuleShellProps) {
  return (
    <main className="min-h-dvh w-full bg-brand-black pt-safe pb-safe text-white">
      <div className="w-full px-4 py-6 md:px-8 lg:px-10">
        <Link
          href="/ops/live-hub"
          className="mb-6 inline-flex min-h-11 items-center font-ui text-[0.62rem] font-bold uppercase tracking-[0.16em] text-brand-muted transition hover:text-brand-blue"
        >
          ← Crew Terminal
        </Link>

        <header className="mb-8 border-b border-brand-border pb-6">
          <p className="font-ui text-[0.58rem] font-bold uppercase tracking-[0.28em] text-brand-blue">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-headline text-fluid-section uppercase tracking-[0.12em]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl font-body text-sm text-brand-muted">{description}</p>
        </header>

        {children}
      </div>
    </main>
  );
}
