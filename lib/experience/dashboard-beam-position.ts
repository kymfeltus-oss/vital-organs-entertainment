/** Match baked-in concert flare row — normalized Y (0–1) in each backdrop asset. */
export type BackdropVariant = "mobile" | "desktop";

const CONCERT_BACKDROP: Record<
  BackdropVariant,
  {
    width: number;
    height: number;
    beamYN: number;
    /** Center performer upper chest — headline top anchors here (below face). */
    heroStackAnchorYN: number;
    cardRowYN: number;
  }
> = {
  desktop: {
    width: 2752,
    height: 1536,
    beamYN: 0.576,
    heroStackAnchorYN: 0.538,
    cardRowYN: 0.655,
  },
  mobile: {
    width: 1408,
    height: 2968,
    beamYN: 0.512,
    heroStackAnchorYN: 0.478,
    cardRowYN: 0.618,
  },
};

export function normalizeBackdropVariant(
  variant: string | undefined | null,
): BackdropVariant {
  return variant === "mobile" ? "mobile" : "desktop";
}

function getBackdropConfig(variant: string | undefined | null) {
  return CONCERT_BACKDROP[normalizeBackdropVariant(variant)];
}

/** Concert lineup backdrop height as a fraction of the viewport (smaller = smaller people). */
export const BACKDROP_HEIGHT_SCALE = 1;

export const HERO_STACK_LAYOUT_VERSION = 37;

export const HERO_STACK_LIFT_PX: Record<BackdropVariant, number> = {
  mobile: 188,
  desktop: 228,
};

type ObjectPositionFractions = { posX: number; posY: number };

/** Parse computed object-position into 0–1 fractions (left/top = 0, center = 0.5). */
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

/** Effective backdrop box height — matches `--backdrop-height-scale` on the img. */
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

/**
 * Map a normalized Y row (0–1) in the source asset to viewport `top` px.
 * Accounts for object-fit: cover, object-position crop, and element box size.
 */
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

/** Metrics for debugging cover crop / beam stability. */
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
  const estimatedTopCropPx = Math.round(overflowY * posY);

  return {
    objectFit: style.objectFit,
    objectPosition: style.objectPosition,
    posX,
    posY,
    scale: Number(scale.toFixed(4)),
    overflow: { x: Math.round(Math.max(0, naturalWidth * scale - clientWidth)), y: Math.round(overflowY) },
    estimatedTopCropPx,
    topPreserved: estimatedTopCropPx <= 4,
    heightScale: BACKDROP_HEIGHT_SCALE,
    expectedClientH: Math.round(window.innerHeight * BACKDROP_HEIGHT_SCALE),
    clientHeightDelta: Math.round(clientHeight - window.innerHeight * BACKDROP_HEIGHT_SCALE),
  };
}

function backdropScale(
  viewportWidth: number,
  viewportHeight: number,
  variant: string | undefined | null,
): number {
  const { width, height } = getBackdropConfig(variant);
  const boxHeight = backdropContainerHeightPx(viewportHeight);
  return Math.max(viewportWidth / width, boxHeight / height);
}

export function resolveActiveBackdropVariant(): BackdropVariant {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(min-width: 768px)").matches ? "desktop" : "mobile";
}

export function concertBeamTopPx(
  variant: string | undefined | null,
  viewportWidth: number,
  viewportHeight: number,
): number {
  const { height, beamYN } = getBackdropConfig(variant);
  return beamYN * height * backdropScale(viewportWidth, viewportHeight, variant);
}

export function concertBeamTopFromBackdropImg(
  img: HTMLImageElement,
  variant: string | undefined | null,
): number {
  const { beamYN } = getBackdropConfig(variant);
  return backdropCoverRowTopPx(img, beamYN);
}

function rowTopFromBackdropImg(
  img: HTMLImageElement,
  variant: string | undefined | null,
  rowKey: "beamYN" | "cardRowYN" | "heroStackAnchorYN",
): number {
  const rowYN = getBackdropConfig(variant)[rowKey];
  const { naturalWidth, naturalHeight } = img;
  if (!naturalWidth || !naturalHeight) {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    return rowYN * getBackdropConfig(variant).height * backdropScale(vw, vh, variant);
  }
  return backdropCoverRowTopPx(img, rowYN);
}

export function concertCardRowTopFromBackdropImg(
  img: HTMLImageElement,
  variant: string | undefined | null,
): number {
  return rowTopFromBackdropImg(img, variant, "cardRowYN");
}

export function concertCardRowTopPx(
  variant: string | undefined | null,
  viewportWidth: number,
  viewportHeight: number,
): number {
  const { height, cardRowYN } = getBackdropConfig(variant);
  return cardRowYN * height * backdropScale(viewportWidth, viewportHeight, variant);
}

export function concertHeroStackAnchorTopFromBackdropImg(
  img: HTMLImageElement,
  variant: string | undefined | null,
): number {
  return rowTopFromBackdropImg(img, variant, "heroStackAnchorYN");
}

export function concertHeroStackAnchorTopPx(
  variant: string | undefined | null,
  viewportWidth: number,
  viewportHeight: number,
): number {
  const { height, heroStackAnchorYN } = getBackdropConfig(variant);
  return heroStackAnchorYN * height * backdropScale(viewportWidth, viewportHeight, variant);
}

/** Headline stack top — anchor marks upper chest; copy starts just below. */
export function dashboardHeroStackTopPx(
  anchorTopPx: number,
  variant: string | undefined | null,
): number {
  const v = normalizeBackdropVariant(variant);
  const gapBelowAnchor = v === "mobile" ? 10 : 14;
  return Math.round(anchorTopPx + gapBelowAnchor - HERO_STACK_LIFT_PX[v]);
}

/** Lowest allowed on screen (largest `top` px) — keeps copy from sliding up onto the face. */
export function dashboardHeroFaceFloorTopPx(
  anchorTopPx: number,
  variant: string | undefined | null,
): number {
  const v = normalizeBackdropVariant(variant);
  /** Chin sits above the chest anchor (smaller `top` px). */
  const chestToChinPx = v === "mobile" ? 32 : 38;
  const gapBelowChinPx = v === "mobile" ? 6 : 8;
  return Math.round(anchorTopPx - chestToChinPx + gapBelowChinPx);
}

/** Place headline so CTAs sit above the baked-in card icon row in the backdrop. */
export function dashboardHeadlineBlockTopPx(
  cardRowTopPx: number,
  extentBelowHeadlineCenterPx: number,
  clearancePx = 40,
): number {
  return Math.round(cardRowTopPx - clearancePx - extentBelowHeadlineCenterPx);
}

export function concertBeamMeta(
  variant: string | undefined | null,
  viewportWidth: number,
  viewportHeight: number,
) {
  const config = getBackdropConfig(variant);
  const scale = backdropScale(viewportWidth, viewportHeight, variant);
  return {
    variant: normalizeBackdropVariant(variant),
    beamYN: config.beamYN,
    beamSourceY: Math.round(config.beamYN * config.height),
    scale: Number(scale.toFixed(4)),
    beamTopPx: Math.round(config.beamYN * config.height * scale),
    asset: { width: config.width, height: config.height },
  };
}
