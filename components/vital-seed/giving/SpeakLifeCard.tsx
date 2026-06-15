import {
  getGivingLayout,
  givingPointStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";

type SpeakLifeCardProps = {
  variant: GivingVariant;
};

export default function SpeakLifeCard({ variant }: SpeakLifeCardProps) {
  const { positions } = getGivingLayout(variant);

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
