import {
  APPLE_MUSIC_SINGLE_URL,
  MUSIC_APPLE_HEADER_POSITIONS,
  MUSIC_ASSETS,
  type MusicOverlayVariant,
} from "@/lib/music/assets";

type MusicAppleMusicHeaderProps = {
  variant: MusicOverlayVariant;
};

export default function MusicAppleMusicHeader({ variant }: MusicAppleMusicHeaderProps) {
  const { transform, ...position } = MUSIC_APPLE_HEADER_POSITIONS[variant];

  return (
    <a
      href={APPLE_MUSIC_SINGLE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Listen or download on Apple Music"
      className="pointer-events-auto absolute z-20 flex items-center justify-center transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      style={{ ...position, transform }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MUSIC_ASSETS.appleMusicHeader}
        alt=""
        className="h-full w-full object-contain"
        draggable={false}
      />
    </a>
  );
}
