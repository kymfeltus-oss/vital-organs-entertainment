import Link from "next/link";
import { findProductionNavItem, PRODUCTION_NAV_SECTIONS } from "@/lib/production/nav";
import { notFound } from "next/navigation";

type ProductionModulePageProps = {
  params: Promise<{ module: string }>;
};

function resolveModuleLabel(module: string): string {
  for (const section of PRODUCTION_NAV_SECTIONS) {
    const item = section.items.find((entry) => entry.href === `/production/${module}`);
    if (item) return item.label;
  }
  return module.replace(/-/g, " ");
}

export default async function ProductionModulePage({ params }: ProductionModulePageProps) {
  const { module } = await params;
  const href = `/production/${module}`;
  const navItem = findProductionNavItem(href);

  if (!navItem && module !== "preshow") {
    notFound();
  }

  if (navItem?.available) {
    notFound();
  }

  const label = resolveModuleLabel(module);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6 md:p-10">
      <p className="font-ui text-[0.52rem] font-bold uppercase tracking-[0.14em] text-brand-blue">
        Parable Streaming Platform
      </p>
      <h1 className="font-headline text-3xl uppercase tracking-[0.08em] text-white">{label}</h1>
      <p className="font-body text-sm text-brand-muted">
        This module is part of the production navigation structure and will connect to dedicated
        workflows as the platform expands. Use Overview and Pre Show for active production tools.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/production-dashboard"
          className="rounded-lg bg-gradient-to-r from-brand-blue via-brand-purple to-brand-pink px-4 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-white"
        >
          Back to Overview
        </Link>
        <Link
          href="/production/preshow"
          className="rounded-lg border border-brand-border px-4 py-2 font-ui text-[0.55rem] font-bold uppercase tracking-[0.1em] text-brand-muted hover:text-white"
        >
          Pre Show Setup
        </Link>
      </div>
    </div>
  );
}
