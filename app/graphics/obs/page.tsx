import type { Metadata } from "next";
import ObsProgramGraphicsOverlay from "@/components/graphics/ObsProgramGraphicsOverlay";
import { loadActiveProgramGraphic } from "@/lib/graphics/program-state";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "300 Awakening Program Graphics Overlay",
  robots: { index: false, follow: false },
};

export default async function ProgramGraphicsObsPage() {
  const initialGraphic = await loadActiveProgramGraphic().catch(() => null);

  return (
    <main
      className="program-graphics-obs-surface fixed inset-0 overflow-hidden bg-transparent"
      aria-label="Program graphics overlay"
    >
      <ObsProgramGraphicsOverlay initialGraphic={initialGraphic} />
    </main>
  );
}
