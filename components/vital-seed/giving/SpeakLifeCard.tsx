import {
  getGivingLayout,
  givingPointStyle,
  givingRectStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";
import { VITAL_SEED_GIVING_ASSETS } from "@/lib/vital-seed/giving-assets";

type SpeakLifeCardProps = {
  variant: GivingVariant;
};

export default function SpeakLifeCard({ variant }: SpeakLifeCardProps) {
  const { positions, panels } = getGivingLayout(variant);

  return (
    <>
      <p
        className="vital-giving-label"
        style={givingPointStyle(positions.speakLifeTitle)}
      >
        Speak Life
      </p>
      <p
        className="vital-giving-body"
        style={givingPointStyle(positions.speakLifeDeclaration)}
      >
        Lord, I sow this seed believing for breakthrough, provision, and impact...
      </p>
      <div
        className="vital-giving-wave-wrap"
        style={givingRectStyle(panels.speakLifeWave)}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={VITAL_SEED_GIVING_ASSETS.waveDivider}
          alt=""
          className="vital-giving-wave-divider"
        />
      </div>
      <p
        className="vital-giving-scripture-quote"
        style={givingPointStyle(positions.speakLifeQuote)}
      >
        &ldquo;Whoever sows generously will also reap generously.&rdquo;
      </p>
      <p
        className="vital-giving-scripture"
        style={givingPointStyle(positions.speakLifeScripture)}
      >
        2 Corinthians 9:6
      </p>
    </>
  );
}
