import AdminLayoutClient from "@/app/admin/AdminLayoutClient";
import { resolveAdminContext } from "@/lib/admin/resolve-admin-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = resolveAdminContext();
  return <AdminLayoutClient context={context}>{children}</AdminLayoutClient>;
}
