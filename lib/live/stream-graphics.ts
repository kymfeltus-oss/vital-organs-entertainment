import {
  decodeGraphicsPresetMetadata,
  OWNER_GRAPHICS_EVENT_ID,
  type GraphicsBuilderKind,
  type GraphicLayoutMode,
  type GraphicPositionAnchor,
  type OwnerGraphicsPreset,
} from "@/lib/owner/graphics-data-plane";

export type LiveStreamGraphicPayload = {
  id: string;
  primary: string;
  secondary: string | null;
  builderKind: GraphicsBuilderKind;
  layoutMode: GraphicLayoutMode;
  positionAnchor: GraphicPositionAnchor;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  zIndex: number;
  imageUrl: string | null;
  mediaUrl: string | null;
};

export type LiveStreamGraphicsResponse = {
  isLive: boolean;
  active: LiveStreamGraphicPayload | null;
};

export function mapOwnerPresetToLiveStreamGraphic(
  preset: OwnerGraphicsPreset,
): LiveStreamGraphicPayload {
  const metadata = decodeGraphicsPresetMetadata(preset);

  return {
    id: preset.id,
    primary: preset.content_primary.trim(),
    secondary: metadata.secondaryText?.trim() || null,
    builderKind: metadata.builderKind,
    layoutMode: metadata.layoutMode,
    positionAnchor: metadata.positionAnchor,
    xPercent: metadata.xPercent,
    yPercent: metadata.yPercent,
    widthPercent: metadata.widthPercent,
    heightPercent: metadata.heightPercent,
    zIndex: metadata.zIndex,
    imageUrl: metadata.imageUrl,
    mediaUrl: metadata.mediaUrl,
  };
}

export { OWNER_GRAPHICS_EVENT_ID };
