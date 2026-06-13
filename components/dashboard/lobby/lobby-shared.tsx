"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";

export function PanelShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[18px] border border-white/10 bg-[#111111] shadow-[0_0_34px_rgba(0,0,0,0.45)] ${className}`}
    >
      {children}
    </section>
  );
}

export const FEATURE_CARD_ASSET_SIZE = 86;

export function BrandIcon({
  src,
  width,
  height,
  alt,
  fallback,
  className = "object-contain",
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  fallback: ReactNode;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  const logIconMetrics = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el?.complete || !el.naturalWidth) return;
      // #region agent log
      fetch("http://127.0.0.1:7473/ingest/ffaee9e4-347e-4ad6-ad91-0ba8a90fd11c", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "75e50a",
        },
        body: JSON.stringify({
          sessionId: "75e50a",
          runId: "icon-fix",
          hypothesisId: "H1-H3",
          location: "lobby-shared.tsx:BrandIcon",
          message: "feature card icon rendered",
          data: {
            src,
            naturalWidth: el.naturalWidth,
            naturalHeight: el.naturalHeight,
            clientWidth: el.clientWidth,
            clientHeight: el.clientHeight,
            targetSize: width,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    },
    [src, width]
  );

  if (failed) return <>{fallback}</>;

  return (
    <Image
      ref={logIconMetrics}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ width: "auto", height: "auto", maxWidth: width, maxHeight: height }}
      onError={() => setFailed(true)}
      onLoad={(e) => logIconMetrics(e.currentTarget)}
    />
  );
}

export function FeatureCardMedia({
  src,
  alt,
  fallback,
}: {
  src: string;
  alt: string;
  fallback: ReactNode;
}) {
  const size = FEATURE_CARD_ASSET_SIZE;

  return (
    <div className="flex h-[86px] w-full shrink-0 items-center justify-center">
      <BrandIcon
        src={src}
        width={size}
        height={size}
        alt={alt}
        fallback={fallback}
        className="h-[86px] w-[86px] object-contain"
      />
    </div>
  );
}

export function FeatureCardShell({
  borderClass,
  media,
  title,
  description,
  button,
}: {
  borderClass: string;
  media: ReactNode;
  title: ReactNode;
  description: ReactNode;
  button: ReactNode;
}) {
  return (
    <div
      className={`flex h-[274px] flex-col items-center gap-2 rounded-[20px] border bg-[#111111] p-[22px] text-center shadow-[0_0_34px_rgba(0,0,0,0.45)] xl:grid xl:h-auto xl:grid-rows-subgrid xl:row-span-4 ${borderClass}`}
    >
      {media}
      <h3 className="flex min-h-[44px] w-full items-start justify-center text-xl font-black uppercase leading-[1.1] tracking-[0.18em] text-white">
        {title}
      </h3>
      <p className="flex min-h-[42px] w-full items-start justify-center text-sm leading-[1.45] text-[#D4D4D8]">
        {description}
      </p>
      <div className="mt-auto w-full shrink-0 xl:mt-0">{button}</div>
    </div>
  );
}

export function FeatureCardButton({
  href,
  label,
  borderClass,
  disabled,
  disabledLabel,
}: {
  href: string;
  label: string;
  borderClass: string;
  disabled?: boolean;
  disabledLabel?: string;
}) {
  if (disabled) {
    return (
      <span
        className={`flex h-[38px] w-full cursor-not-allowed items-center justify-center rounded-[10px] border bg-transparent text-[11px] font-black uppercase tracking-[0.18em] text-[#A1A1AA] ${borderClass}`}
      >
        {disabledLabel ?? label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`flex h-[38px] w-full items-center justify-center rounded-[10px] border bg-transparent text-[11px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/5 ${borderClass}`}
    >
      {label}
    </Link>
  );
}

export const IMPACT_STATS = [
  { value: "12,482", label: "Viewers Ready", iconName: "users" as const },
  { value: "2,312", label: "Prayer Requests", iconName: "hand-heart" as const },
  { value: "4,981", label: "Seeds Sown", iconName: "sprout" as const },
  { value: "1,242", label: "Event Shares", iconName: "share" as const },
] as const;
