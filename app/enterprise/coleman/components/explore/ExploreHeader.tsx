"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

function ProfileAvatar() {
  return (
    <span className="exo-avatar" aria-hidden>
      <span className="exo-avatar-portrait" />
    </span>
  );
}

export default function ExploreHeader() {
  return (
    <header className="exo-header">
      <Link href={COLEMAN_ROUTES.explore} className="exo-glass-button exo-header-btn" aria-label="Menu">
        <Menu size={18} strokeWidth={1.35} />
      </Link>

      <Link href={COLEMAN_ROUTES.home} className="exo-wordmark" aria-label="Coleman home">
        COLEMAN
      </Link>

      <Link href={COLEMAN_ROUTES.library} className="exo-glass-button exo-header-btn" aria-label="Profile">
        <ProfileAvatar />
      </Link>
    </header>
  );
}
