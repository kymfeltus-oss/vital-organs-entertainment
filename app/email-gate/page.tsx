import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PersonaHubClient from "@/components/auth/PersonaHubClient";

function PersonaHubFallback() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-brand-black text-brand-muted">
      <Loader2 className="h-5 w-5 animate-spin text-brand-blue" aria-hidden="true" />
      <span className="sr-only">Loading entry hub</span>
    </main>
  );
}

export default function EmailGatePage() {
  return (
    <Suspense fallback={<PersonaHubFallback />}>
      <PersonaHubClient />
    </Suspense>
  );
}
