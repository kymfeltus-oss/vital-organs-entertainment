import { AWAKENING_CONCERT_BACKDROP_ART } from "@/lib/experience/awakening-dashboard-assets";

/** Single mobile-first dashboard backdrop — normalized Y (0–1) in the asset. */
export type BackdropVariant = "mobile";

const CONCERT_BACKDROP = {
  width: AWAKENING_CONCERT_BACKDROP_ART.width,
  height: AWAKENING_CONCERT_BACKDROP_ART.height,
  beamYN: 0.512,
  heroStackAnchorYN: 0.478,
  cardRowYN: 0.618,
} as const;

export function normalizeBackdropVariant(
  _variant: string | undefined | null,
): BackdropVariant {
  return "mobile";
}

export const BACKDROP_HEIGHT_SCALE = 1;

export const HERO_STACK_LAYOUT_VERSION = 40;

export const HERO_STACK_LIFT_PX = 148;

type ObjectPositionFractions = { posX: number; posY: number };

export function parseObjectPosition(value: string): ObjectPositionFractions {
  const parts = value.trim().split(/\s+/);
  const axis = (token: string, defaultCenter: boolean): number => {
    if (token === "left" || token === "top") return 0;
    if (token === "right" || token === "bottom") return 1;
    if (token === "center") return 0.5;
    if (token.endsWith("%")) return parseFloat(token) / 100;
    return defaultCenter ? 0.5 : 0;
  };

  if (parts.length === 1) {
    const lone = parts[0];
    if (lone === "top" || lone === "bottom") return { posX: 0.5, posY: axis(lone, false) };
    if (lone === "left" || lone === "right") return { posX: axis(lone, false), posY: 0.5 };
    return { posX: axis(lone, true), posY: 0.5 };
  }

  return { posX: axis(parts[0], true), posY: axis(parts[1], false) };
}

export function backdropContainerHeightPx(viewportHeight: number): number {
  return viewportHeight * BACKDROP_HEIGHT_SCALE;
}

function backdropCoverScale(
  boxWidth: number,
  boxHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): number {
  return Math.max(boxWidth / naturalWidth, boxHeight / naturalHeight);
}

export function backdropCoverRowTopPx(
  img: HTMLImageElement | null | undefined,
  rowYN: number,
): number {
  if (!img) return 0;
  const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
  if (!naturalWidth || !naturalHeight || !clientWidth || !clientHeight) return 0;

  const scale = backdropCoverScale(
    clientWidth,
    clientHeight,
    naturalWidth,
    naturalHeight,
  );
  const renderedH = naturalHeight * scale;
  const rect = img.getBoundingClientRect();

  const style = window.getComputedStyle(img);
  const { posY } = parseObjectPosition(style.objectPosition);
  const offsetY = (clientHeight - renderedH) * posY;

  return rect.top + offsetY + rowYN * renderedH;
}

export function backdropCoverMetrics(img: HTMLImageElement | null | undefined) {
  if (!img) {
    return {
      objectFit: "",
      objectPosition: "",
      posX: 0,
      posY: 0,
      scale: 0,
      overflow: { x: 0, y: 0 },
      estimatedTopCropPx: 0,
      topPreserved: true,
      heightScale: BACKDROP_HEIGHT_SCALE,
      expectedClientH: 0,
      clientHeightDelta: 0,
    };
  }

  const { naturalWidth, naturalHeight, clientWidth, clientHeight } = img;
  const style = window.getComputedStyle(img);
  const { posX, posY } = parseObjectPosition(style.objectPosition);
  const scale =
    naturalWidth > 0 && naturalHeight > 0
      ? backdropCoverScale(clientWidth, clientHeight, naturalWidth, naturalHeight)
      : 0;
  const renderedH = naturalHeight * scale;
  const overflowY = Math.max(0, renderedH - clientHeight);

  return {
    objectFit: style.objectFit,
    objectPosition: style.objectPosition,
    posX,
    posY,
    scale: Number(scale.toFixed(4)),
    overflow: {
      x: Math.round(Math.max(0, naturalWidth * scale - clientWidth)),
      y: Math.round(overflowY),
    },
    estimatedTopCropPx: Math.round(overflowY * posY),
    topPreserved: Math.round(overflowY * posY) <= 4,
    heightScale: BACKDROP_HEIGHT_SCALE,
    expectedClientH: Math.round(window.innerHeight * BACKDROP_HEIGHT_SCALE),
    clientHeightDelta: Math.round(clientHeight - window.innerHeight * BACKDROP_HEIGHT_SCALE),
  };
}

function backdropScale(viewportWidth: number, viewportHeight: number): number {
  const { width, height } = CONCERT_BACKDROP;
  const boxHeight = backdropContainerHeightPx(viewportHeight);
  return Math.max(viewportWidth / width, boxHeight / height);
}

export function resolveActiveBackdropVariant(): BackdropVariant {
  return "mobile";
}

export function concertBeamTopPx(viewportWidth: number, viewportHeight: number): number {
  return CONCERT_BACKDROP.beamYN * CONCERT_BACKDROP.height * backdropScale(viewportWidth, viewportHeight);
}

export function concertBeamTopFromBackdropImg(img: HTMLImageElement): number {
  return backdropCoverRowTopPx(img, CONCERT_BACKDROP.beamYN);
}

function rowTopFromBackdropImg(
  img: HTMLImageElement,
  rowKey: "beamYN" | "cardRowYN" | "heroStackAnchorYN",
): number {
  const rowYN = CONCERT_BACKDROP[rowKey];
  const { naturalWidth, naturalHeight } = img;
  if (!naturalWidth || !naturalHeight) {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    return rowYN * CONCERT_BACKDROP.height * backdropScale(vw, vh);
  }
  return backdropCoverRowTopPx(img, rowYN);
}

export function concertCardRowTopFromBackdropImg(img: HTMLImageElement): number {
  return rowTopFromBackdropImg(img, "cardRowYN");
}

export function concertCardRowTopPx(viewportWidth: number, viewportHeight: number): number {
  return CONCERT_BACKDROP.cardRowYN * CONCERT_BACKDROP.height * backdropScale(viewportWidth, viewportHeight);
}

export function concertHeroStackAnchorTopFromBackdropImg(img: HTMLImageElement): number {
  return rowTopFromBackdropImg(img, "heroStackAnchorYN");
}

export function concertHeroStackAnchorTopPx(viewportWidth: number, viewportHeight: number): number {
  return CONCERT_BACKDROP.heroStackAnchorYN * CONCERT_BACKDROP.height * backdropScale(viewportWidth, viewportHeight);
}

export function dashboardHeroStackTopPx(anchorTopPx: number): number {
  return Math.round(anchorTopPx + 10 - HERO_STACK_LIFT_PX);
}

export function dashboardHeroFaceFloorTopPx(anchorTopPx: number): number {
  return Math.round(anchorTopPx - 32 + 6);
}

export function dashboardHeadlineBlockTopPx(
  cardRowTopPx: number,
  extentBelowHeadlineCenterPx: number,
  clearancePx = 40,
): number {
  return Math.round(cardRowTopPx - clearancePx - extentBelowHeadlineCenterPx);
}

export function concertBeamMeta(viewportWidth: number, viewportHeight: number) {
  const scale = backdropScale(viewportWidth, viewportHeight);
  return {
    variant: "mobile" as const,
    beamYN: CONCERT_BACKDROP.beamYN,
    beamSourceY: Math.round(CONCERT_BACKDROP.beamYN * CONCERT_BACKDROP.height),
    scale: Number(scale.toFixed(4)),
    beamTopPx: Math.round(CONCERT_BACKDROP.beamYN * CONCERT_BACKDROP.height * scale),
    asset: { width: CONCERT_BACKDROP.width, height: CONCERT_BACKDROP.height },
  };
}
