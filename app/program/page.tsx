import type { Metadata } from "next";
import ProgramPageClient from "@/components/features/program/ProgramPageClient";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { loadShowSetupState } from "@/lib/owner/show-setup-state";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";
import "@/styles/features/awakening-program.css";
import "@/styles/features/awakening-program-mobile-standard.css";

export const dynamic = "force-dynamic";

const PROGRAM_PREVIEW_IMAGE = "/branding/awakening-lockup.png";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: `Digital Program | ${PLATFORM_APP_NAME}`,
  description: `Interactive digital event program for ${PLATFORM_APP_NAME}.`,
  alternates: {
    canonical: "/program",
  },
  openGraph: {
    title: `Digital Program | ${PLATFORM_APP_NAME}`,
    description: `View the ${PLATFORM_APP_NAME} digital program.`,
    url: "/program",
    siteName: PLATFORM_APP_NAME,
    type: "website",
    images: [
      {
        url: PROGRAM_PREVIEW_IMAGE,
        width: 1536,
        height: 1024,
        alt: `${PLATFORM_APP_NAME} program`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Digital Program | ${PLATFORM_APP_NAME}`,
    description: `View the ${PLATFORM_APP_NAME} digital program.`,
    images: [PROGRAM_PREVIEW_IMAGE],
  },
};

export default async function AwakeningProgramPage() {
  const [countdownConfig, showSetup] = await Promise.all([
    loadActiveCountdownConfig(),
    loadShowSetupState(),
  ]);

  return (
    <ProgramPageClient
      initialCountdownDetails={{
        ...countdownConfig,
        eventLocation: showSetup.eventLocation,
        livestreamAvailability: showSetup.livestreamAvailability,
      }}
    />
  );
}
