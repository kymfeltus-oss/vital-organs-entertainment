import Link from "next/link";
import {
  MUSIC_MOVEMENT_CARD_POSITIONS,
  type MusicOverlayVariant,
} from "@/lib/music/assets";

type MusicOverlayProps = {
  variant: MusicOverlayVariant;
};

export default function MusicOverlay({ variant }: MusicOverlayProps) {
  const movementCards = MUSIC_MOVEMENT_CARD_POSITIONS[variant];

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {movementCards.map((card) => (
        <Link
          key={`${variant}-${card.href}`}
          href={card.href}
          aria-label={card.label}
          className="pointer-events-auto absolute rounded-2xl bg-transparent transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          style={{
            left: card.left,
            top: card.top,
            width: card.width,
            height: card.height,
          }}
        />
      ))}
    </div>
  );
}
