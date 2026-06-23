import { requireOpsAdminUser } from "@/lib/ops/assert-ops-admin";

export default async function OpsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOpsAdminUser("/ops");
  return children;
}
