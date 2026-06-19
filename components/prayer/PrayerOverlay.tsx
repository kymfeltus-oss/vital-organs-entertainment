import Link from "next/link";
import { ATTENDEE_DASHBOARD_PATH } from "@/lib/navigation/back-to-dashboard";
import { PRAYER_ACTION_SLOTS, PRAYER_BACK_SLOT } from "@/lib/prayer/prayer-slots";

export default function PrayerOverlay() {
  return (
    <div className="prayer-page__actions" aria-label="Prayer page actions">
      <Link
        href={ATTENDEE_DASHBOARD_PATH}
        aria-label={PRAYER_BACK_SLOT.label}
        className="prayer-page__action touch-target rounded-[999px] bg-transparent transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        style={{
          left: PRAYER_BACK_SLOT.left,
          top: PRAYER_BACK_SLOT.top,
          width: PRAYER_BACK_SLOT.width,
          height: PRAYER_BACK_SLOT.height,
        }}
      />

      {PRAYER_ACTION_SLOTS.map((action) => {
        const hitClassName =
          "prayer-page__action touch-target rounded-[999px] bg-transparent transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";
        const style = {
          left: action.left,
          top: action.top,
          width: action.width,
          height: action.height,
        };

        if (action.external) {
          return (
            <a
              key={action.id}
              href={action.href}
              target={action.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={action.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              aria-label={action.label}
              className={hitClassName}
              style={style}
            />
          );
        }

        return (
          <Link
            key={action.id}
            href={action.href}
            aria-label={action.label}
            className={hitClassName}
            style={style}
          />
        );
      })}
    </div>
  );
}
