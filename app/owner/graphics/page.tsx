import Link from "next/link";
import { ArrowLeft, ExternalLink, MonitorPlay } from "lucide-react";
import GraphicsSuitePrepClient from "@/components/owner/GraphicsSuitePrepClient";

export const dynamic = "force-dynamic";

export default function OwnerGraphicsPage() {
  return (
    <main className="min-h-screen bg-[#030611] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <Link
              href="/owner/control"
              className="inline-flex items-center gap-2 font-ui text-xs uppercase tracking-[0.16em] text-[#00DDEB]"
            >
              <ArrowLeft className="h-4 w-4" /> Production Control
            </Link>
            <h1 className="mt-3 font-headline text-3xl uppercase tracking-[0.08em] sm:text-4xl">
              Broadcast Graphics Data Plane
            </h1>
            <p className="mt-2 max-w-3xl font-body text-sm text-white/55">
              Prepare lower-thirds, scripture, offering, ticker, and slate graphics from one
              synchronized Supabase-backed catalog before the cockpit takes them live.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/owner/cockpit"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#096bff] px-4 font-ui text-xs uppercase tracking-[0.12em] text-white"
            >
              <MonitorPlay className="h-4 w-4" />
              Open Cockpit
            </Link>
            <Link
              href="/graphics/obs"
              target="_blank"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#00DDEB]/45 px-4 font-ui text-xs uppercase tracking-[0.12em] text-[#00DDEB]"
            >
              OBS Overlay <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <div className="mt-6">
          <GraphicsSuitePrepClient />
        </div>
      </div>
    </main>
  );
}
