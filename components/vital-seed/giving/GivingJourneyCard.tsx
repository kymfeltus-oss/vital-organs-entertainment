import {
  getGivingLayout,
  givingPointStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";

type GivingJourneyCardProps = {
  variant: GivingVariant;
};

export default function GivingJourneyCard({ variant }: GivingJourneyCardProps) {
  const { positions } = getGivingLayout(variant);

  return (
    <>
      <p
        className="vital-giving-label"
        style={givingPointStyle(positions.journeyTitle)}
      >
        Giving Journey
      </p>
      <span
        className="vital-giving-metric-label"
        style={givingPointStyle(positions.journeyMetric1Label)}
      >
        Total Seeds Sown
      </span>
      <span
        className="vital-giving-metric-value"
        style={givingPointStyle(positions.journeyMetric1Value)}
      >
        $14,250.00
      </span>
      <span
        className="vital-giving-metric-label"
        style={givingPointStyle(positions.journeyMetric2Label)}
      >
        Lives Impacted
      </span>
      <span
        className="vital-giving-metric-value"
        style={givingPointStyle(positions.journeyMetric2Value)}
      >
        1,842
      </span>
      <span
        className="vital-giving-metric-label"
        style={givingPointStyle(positions.journeyMetric3Label)}
      >
        Months Giving
      </span>
      <span
        className="vital-giving-metric-value"
        style={givingPointStyle(positions.journeyMetric3Value)}
      >
        18
      </span>
    </>
  );
}
