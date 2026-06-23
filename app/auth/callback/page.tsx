import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AuthCallbackClient from "@/components/auth/AuthCallbackClient";

export const dynamic = "force-dynamic";

function AuthCallbackFallback() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-brand-black text-brand-muted">
      <Loader2 className="h-6 w-6 animate-spin text-brand-blue" aria-hidden="true" />
      <span className="sr-only">Completing sign in</span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackClient />
    </Suspense>
  );
}
