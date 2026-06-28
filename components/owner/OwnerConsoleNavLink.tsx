"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type OwnerConsoleNavLinkProps = {
  href: string;
  icon: string;
  label: string;
  description?: string;
  onNavigate?: () => void;
};

export default function OwnerConsoleNavLink({
  href,
  icon,
  label,
  description,
  onNavigate,
}: OwnerConsoleNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        isActive
          ? "border-slate-600 bg-slate-800 text-slate-50 shadow-[inset_3px_0_0_0_#38bdf8]"
          : "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-100"
      }`}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-ui text-[0.68rem] font-bold uppercase tracking-[0.12em]">
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block truncate font-body text-[0.62rem] text-slate-500 group-hover:text-slate-400">
            {description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
