import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import EmailGatePageClient from "@/components/email-gate/EmailGatePageClient";
export const dynamic = "force-dynamic";

function EmailGateFallback() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-brand-black text-brand-muted">
      <Loader2 className="h-5 w-5 animate-spin text-brand-blue" aria-hidden="true" />
      <span className="sr-only">Loading entry hub</span>
    </div>
  );
}

export default function EmailGatePage() {
  return (
    <main
      id="main-content"
      className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-brand-black"
      aria-label="Entry hub"
    >
      <Suspense fallback={<EmailGateFallback />}>
        <EmailGatePageClient />
      </Suspense>
    </main>
  );
}
