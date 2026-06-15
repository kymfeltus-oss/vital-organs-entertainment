import {
  getGivingLayout,
  givingPointStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";
import VitalSeedIcon from "@/components/vital-seed/giving/VitalSeedIcon";

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
      <VitalSeedIcon
        asset="seedIcon"
        alt="Total seeds sown"
        className="vital-giving-metric-icon vital-giving-hit"
        style={givingPointStyle(positions.journeyMetric1Icon)}
      />
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
      <VitalSeedIcon
        asset="peopleIcon"
        alt="Lives impacted"
        className="vital-giving-metric-icon vital-giving-hit"
        style={givingPointStyle(positions.journeyMetric2Icon)}
      />
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
      <VitalSeedIcon
        asset="calendarIcon"
        alt="Months giving"
        className="vital-giving-metric-icon vital-giving-hit"
        style={givingPointStyle(positions.journeyMetric3Icon)}
      />
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
