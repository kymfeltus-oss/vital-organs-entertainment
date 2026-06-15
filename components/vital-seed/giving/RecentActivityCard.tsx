import {
  getGivingLayout,
  givingPointStyle,
  type GivingVariant,
} from "@/lib/experience/giving-layout-slots";
import VitalSeedIcon from "@/components/vital-seed/giving/VitalSeedIcon";

type RecentActivityCardProps = {
  variant: GivingVariant;
};

export default function RecentActivityCard({ variant }: RecentActivityCardProps) {
  const { positions } = getGivingLayout(variant);

  return (
    <>
      <p
        className="vital-giving-label"
        style={givingPointStyle(positions.activityTitle)}
      >
        Recent Activity
      </p>
      <button
        type="button"
        className="vital-giving-view-all vital-giving-hit touch-target"
        style={givingPointStyle(positions.viewAllActivity)}
      >
        View All Activity
        <VitalSeedIcon
          asset="chevronRight"
          alt=""
          className="vital-giving-view-all-chevron"
        />
      </button>
      <VitalSeedIcon
        asset="activityIcon"
        alt="Vital Seed activity"
        className="vital-giving-activity-icon vital-giving-hit"
        style={givingPointStyle(positions.activity1Icon)}
      />
      <span
        className="vital-giving-activity-title"
        style={givingPointStyle(positions.activity1Title)}
      >
        Vital Seed
      </span>
      <span
        className="vital-giving-activity-date"
        style={givingPointStyle(positions.activity1Date)}
      >
        Today
      </span>
      <span
        className="vital-giving-activity-amount"
        style={givingPointStyle(positions.activity1Amount)}
      >
        $100.00
      </span>
      <VitalSeedIcon
        asset="heartIcon"
        alt="Tithe activity"
        className="vital-giving-activity-icon vital-giving-hit"
        style={givingPointStyle(positions.activity2Icon)}
      />
      <span
        className="vital-giving-activity-title"
        style={givingPointStyle(positions.activity2Title)}
      >
        Tithe
      </span>
      <span
        className="vital-giving-activity-date"
        style={givingPointStyle(positions.activity2Date)}
      >
        Jan 15, 2025
      </span>
      <span
        className="vital-giving-activity-amount"
        style={givingPointStyle(positions.activity2Amount)}
      >
        $250.00
      </span>
      <VitalSeedIcon
        asset="peopleIcon"
        alt="Outreach activity"
        className="vital-giving-activity-icon vital-giving-hit"
        style={givingPointStyle(positions.activity3Icon)}
      />
      <span
        className="vital-giving-activity-title"
        style={givingPointStyle(positions.activity3Title)}
      >
        Outreach
      </span>
      <span
        className="vital-giving-activity-date"
        style={givingPointStyle(positions.activity3Date)}
      >
        Jan 10, 2025
      </span>
      <span
        className="vital-giving-activity-amount"
        style={givingPointStyle(positions.activity3Amount)}
      >
        $50.00
      </span>
    </>
  );
}
