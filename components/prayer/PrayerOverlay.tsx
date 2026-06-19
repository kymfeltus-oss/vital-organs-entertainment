import Link from "next/link";
import { PRAYER_ACTION_SLOTS } from "@/lib/prayer/prayer-slots";

export default function PrayerOverlay() {
  return (
    <div className="prayer-page__actions" aria-label="Prayer page actions">
      {PRAYER_ACTION_SLOTS.map((action) => {
        const hitClassName = "prayer-page__action";
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
