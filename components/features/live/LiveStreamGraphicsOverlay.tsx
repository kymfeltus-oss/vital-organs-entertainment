"use client";

import type { LiveStreamGraphicPayload } from "@/lib/live/stream-graphics";

type LiveStreamGraphicsOverlayProps = {
  graphic: LiveStreamGraphicPayload;
};

function LowerThirdOverlay({
  mainText,
  subtitleText,
  logoUrl,
}: {
  mainText: string;
  subtitleText?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] px-4 pb-[calc(var(--live-mobile-dock-h,4.5rem)+0.75rem)] lg:pb-6">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="absolute right-4 top-0 max-h-[14%] max-w-[42%] -translate-y-[calc(100%+0.5rem)] object-contain drop-shadow-[0_0_12px_rgba(0,168,255,0.55)]"
        />
      ) : null}
      <div className="relative w-full overflow-hidden rounded-lg border border-white/14 bg-[linear-gradient(100deg,rgba(1,5,15,0.94),rgba(7,20,42,0.9)_42%,rgba(28,8,30,0.88))] px-3 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.55)] backdrop-blur-md">
        <div className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#00ddeb,#1677ff,#ff2faf)]" />
        <p className="break-words font-ui text-[0.58rem] font-black uppercase leading-tight tracking-[0.05em] text-white sm:text-[0.62rem]">
          {mainText}
        </p>
        {subtitleText ? (
          <p className="mt-1 break-words font-ui text-[0.46rem] font-black uppercase tracking-[0.12em] text-[#ff4eb7] sm:text-[0.5rem]">
            {subtitleText}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SlateOverlay({
  headerText,
  bodyText,
  logoUrl,
}: {
  headerText: string;
  bodyText?: string | null;
  logoUrl?: string | null;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden bg-black/35 px-4 pb-[var(--live-mobile-dock-h,4.5rem)] pt-4 text-center lg:pb-6">
      <div className="w-full max-w-md rounded-xl border border-white/14 bg-[linear-gradient(135deg,rgba(6,12,26,0.9),rgba(13,21,45,0.82)_48%,rgba(28,8,31,0.86))] px-4 py-5 shadow-[0_18px_48px_rgba(0,0,0,0.55)]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="mx-auto mb-3 max-h-10 max-w-[40%] object-contain" />
        ) : null}
        <div className="mx-auto mb-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#00ddeb] via-[#1677ff] to-[#ff2faf]" />
        <h3 className="break-words font-headline text-sm font-black uppercase leading-tight tracking-[0.06em] text-white sm:text-base">
          {headerText}
        </h3>
        {bodyText ? (
          <p className="mt-2 break-words font-body text-[0.62rem] leading-snug text-white/78 sm:text-sm">
            {bodyText}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TickerOverlay({ text }: { text: string }) {
  return (
    <>
      <style>{`
        @keyframes live-stream-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .live-stream-ticker-track {
          animation: live-stream-ticker 18s linear infinite;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-x-0 bottom-[var(--live-mobile-dock-h,4.5rem)] z-[1] overflow-hidden border-t border-white/10 bg-black/75 py-2 lg:bottom-0">
        <div className="live-stream-ticker-track whitespace-nowrap font-ui text-[0.58rem] font-black uppercase tracking-[0.14em] text-white sm:text-[0.62rem]">
          <span className="inline-block px-4">{text}</span>
          <span className="inline-block px-4" aria-hidden="true">
            {text}
          </span>
        </div>
      </div>
    </>
  );
}

function PositionedOverlay({
  graphic,
  children,
}: {
  graphic: LiveStreamGraphicPayload;
  children: React.ReactNode;
}) {
  const transform =
    graphic.positionAnchor === "CENTER"
      ? "translate(-50%, -50%)"
      : graphic.positionAnchor === "TOP_RIGHT"
        ? "translate(-100%, 0)"
        : graphic.positionAnchor === "BOTTOM_LEFT"
          ? "translate(0, -100%)"
          : graphic.positionAnchor === "BOTTOM_RIGHT"
            ? "translate(-100%, -100%)"
            : undefined;

  if (graphic.positionAnchor === "FULLSCREEN") {
    return <div className="pointer-events-none absolute inset-0 z-[1]">{children}</div>;
  }

  return (
    <div
      className="pointer-events-none absolute z-[1]"
      style={{
        left: `${graphic.xPercent}%`,
        top: `${graphic.yPercent}%`,
        width: `${graphic.widthPercent}%`,
        height: `${graphic.heightPercent}%`,
        transform,
      }}
    >
      {children}
    </div>
  );
}

/** In-app lower thirds, slates, and sanctuary video pushed from Owner Cockpit DISPLAY NOW. */
export default function LiveStreamGraphicsOverlay({ graphic }: LiveStreamGraphicsOverlayProps) {
  const primary = graphic.primary.trim() || "LIVE GRAPHIC";
  const secondary = graphic.secondary?.trim() || null;
  const isSanctuaryVideo = graphic.builderKind === "SANCTUARY_VIDEO" && Boolean(graphic.mediaUrl);
  const isSlate = graphic.builderKind === "SLATE" || graphic.layoutMode === "fullscreen";
  const isTicker = graphic.builderKind === "TICKER" || graphic.layoutMode === "ticker";

  if (isSanctuaryVideo && graphic.mediaUrl) {
    return (
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black">
        <video
          src={graphic.mediaUrl}
          className="h-full w-full object-cover lg:object-contain"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
    );
  }

  if (isSlate) {
    return (
      <SlateOverlay headerText={primary} bodyText={secondary} logoUrl={graphic.imageUrl} />
    );
  }

  if (isTicker) {
    return <TickerOverlay text={primary} />;
  }

  if (graphic.layoutMode === "corner_bug") {
    return (
      <PositionedOverlay graphic={graphic}>
        <div className="flex h-full w-full items-center justify-center rounded-md border border-white/14 bg-black/72 px-2 py-1 backdrop-blur-sm">
          <p className="break-words text-center font-ui text-[0.46rem] font-black uppercase tracking-[0.08em] text-white sm:text-[0.52rem]">
            {primary}
          </p>
        </div>
      </PositionedOverlay>
    );
  }

  return (
    <LowerThirdOverlay mainText={primary} subtitleText={secondary} logoUrl={graphic.imageUrl} />
  );
}
