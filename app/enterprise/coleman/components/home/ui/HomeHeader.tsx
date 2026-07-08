import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import colemanLogo from "@/app/enterprise/coleman/coleman_logo.png";
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
          className="coleman-home-logo-wrap"
          aria-label="COLEMAN home"
        >
          <Image
            src={colemanLogo}
            alt=""
            width={220}
            height={72}
            className="coleman-header-logo"
            style={{ width: "auto" }}
            priority
          />
        </Link>

        <div className="coleman-header-actions">
          <Link
            href={COLEMAN_ROUTES.library}
            className="coleman-header-control coleman-avatar"
            aria-label="Open profile and library"
          >
            <ProfileAvatar />
          </Link>
        </div>
      </div>
    </header>
  );
}
