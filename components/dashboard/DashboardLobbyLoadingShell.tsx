import { DEVICE_FIT_PAGE, DEVICE_FIT_SCROLL, LOBBY_GRID } from "@/lib/responsive";
import type { EventCountdownConfig } from "@/lib/live/countdown-config";

type DashboardLobbyLoadingShellProps = {
  config: EventCountdownConfig;
};

/**
 * Server-rendered shell so LCP text paints before the client lobby bundle hydrates.
 */
export default function DashboardLobbyLoadingShell({
  config,
}: DashboardLobbyLoadingShellProps) {
  return (
    <div className={`${DEVICE_FIT_PAGE} overflow-hidden bg-[#050406] text-white`}>
      <div className={LOBBY_GRID}>
        <div className="hidden min-h-dvh w-full max-w-[260px] shrink-0 border-r border-white/6 bg-[#050406] lg:block" />

        <main className={`${DEVICE_FIT_SCROLL} px-[clamp(1rem,3vw,1.5rem)] pt-5 pb-32 lg:pb-5`}>
          <section className="relative h-[clamp(16rem,42dvh,29.7rem)] shrink-0 overflow-hidden rounded-[24px] border border-[#1E40AF]/55 bg-[#050406]">
            <div className="relative z-10 flex h-full flex-col items-center pt-[26px] text-center">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.52em] text-[#93C5FD]">
                {config.eyebrow}
              </p>
              <h1
                className="mb-[14px] font-black uppercase leading-[0.95] tracking-[0.18em] text-white"
                style={{ fontSize: "clamp(54px, 4.35vw, 76px)" }}
              >
                {config.headline}
              </h1>
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.36em] text-white">
                {config.subtitle}
              </p>
            </div>
          </section>
        </main>

        <div className="hidden min-h-dvh w-full max-w-[360px] shrink-0 border-l border-white/10 bg-[#050406] lg:block" />
      </div>
    </div>
  );
}
