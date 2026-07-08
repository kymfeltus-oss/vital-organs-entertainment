"use client";

import { usePathname } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import type { TenantAdminContext } from "@/lib/admin/types";

type AdminLayoutClientProps = {
  children: React.ReactNode;
  context: TenantAdminContext;
};

export default function AdminLayoutClient({ children, context }: AdminLayoutClientProps) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin/settings/branding")) {
    return <>{children}</>;
  }

  return <AdminShell context={context}>{children}</AdminShell>;
}
