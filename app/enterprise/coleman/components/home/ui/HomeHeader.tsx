import Link from "next/link";
import { Menu } from "lucide-react";

import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

function StatusIcons() {
  return (
    <div className="coleman-status-icons" aria-hidden>
      <span className="coleman-cellular"><i /><i /><i /><i /></span>
      <span className="coleman-wifi"><i /><i /><i /></span>
      <span className="coleman-battery"><i /></span>
    </div>
  );
}

function ProfileAvatar() {
  return (
    <span className="coleman-profile-art" aria-hidden>
      <span className="coleman-profile-hat" />
      <span className="coleman-profile-head" />
      <span className="coleman-profile-body" />
    </span>
  );
}

export default function HomeHeader() {
  return (
    <header className="coleman-home-header">
      <div className="coleman-status-bar">
        <span className="coleman-status-time">9:41</span>
        <StatusIcons />
      </div>

      <div className="coleman-brand-row">
        <Link
          href={COLEMAN_ROUTES.explore}
          className="coleman-header-control"
          aria-label="Open menu"
        >
          <Menu size={23} strokeWidth={1.35} aria-hidden />
        </Link>

        <Link
          href={COLEMAN_ROUTES.home}
          className="coleman-wordmark"
          aria-label="COLEMAN home"
        >
          COLEMAN
        </Link>

        <Link
          href={COLEMAN_ROUTES.library}
          className="coleman-header-control coleman-avatar"
          aria-label="Open profile and library"
        >
          <ProfileAvatar />
        </Link>
      </div>
    </header>
  );
}
