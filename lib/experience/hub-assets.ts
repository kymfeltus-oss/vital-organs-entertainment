/** Approved hub branding — not a scene overlay. */
export const HUB_LOGO = "/assets/branding/300-awakening-logo.png";

const HUB_OVERLAY_ASSET_PATTERNS = [
  /\/effects\//i,
  /\/orbs\//i,
  /hero-audience/i,
  /\/intro-video/i,
  /\/images\/hub-bg/i,
  /\/images\/ian-thumbnail/i,
  /\/images\/single-artwork/i,
] as const;

export function isHubOverlayAssetUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  const normalized = url.trim();
  return HUB_OVERLAY_ASSET_PATTERNS.some((pattern) => pattern.test(normalized));
}

/** Hub UI must not render scene overlay plates — only the dashboard background is allowed. */
export function sanitizeHubDecorativeImageUrl(url: string | null | undefined): null {
  if (!url?.trim() || isHubOverlayAssetUrl(url)) return null;
  return null;
}
