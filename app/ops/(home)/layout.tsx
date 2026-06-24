import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export default async function OpsHomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOpsAdminUser("/ops");
  return children;
}
