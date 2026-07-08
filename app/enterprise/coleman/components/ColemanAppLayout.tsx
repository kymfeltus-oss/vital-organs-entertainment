"use client";

import { usePathname } from "next/navigation";

import { COLEMAN_ROUTES } from "@/app/enterprise/coleman/lib/routes";

import { ColemanAudioProvider } from "./ColemanAudioProvider";
import ColemanMobileChrome from "./ColemanMobileChrome";
import { useColemanAudio } from "./ColemanAudioProvider";

function ColemanChromeFrame({ children }: { children: React.ReactNode }) {
  const { stopAll } = useColemanAudio();
  return <ColemanMobileChrome onStopAudio={stopAll}>{children}</ColemanMobileChrome>;
}

export default function ColemanAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomeStudio = pathname === COLEMAN_ROUTES.home;

  return (
    <ColemanAudioProvider>
      {isHomeStudio ? children : <ColemanChromeFrame>{children}</ColemanChromeFrame>}
    </ColemanAudioProvider>
  );
}
