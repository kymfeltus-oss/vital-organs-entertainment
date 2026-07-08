import Link from "next/link";
import { Menu } from "lucide-react";

import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

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
