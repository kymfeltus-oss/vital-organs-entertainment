import AdminShell from "@/components/admin/AdminShell";
import { resolveAdminContext } from "@/lib/admin/resolve-admin-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = resolveAdminContext();

  return <AdminShell context={context}>{children}</AdminShell>;
}
