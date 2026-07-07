import { Suspense } from "react";
import EnterpriseContactPage from "@/components/admin/EnterpriseContactPage";

export const dynamic = "force-dynamic";

export default function ContactUsPage() {
  return (
    <Suspense fallback={null}>
      <EnterpriseContactPage />
    </Suspense>
  );
}
