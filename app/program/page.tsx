import type { Metadata } from "next";
import AwakeningProgramClient from "@/components/experience/program/AwakeningProgramClient";
import { loadActiveCountdownConfig } from "@/lib/live/fetch-countdown-config";
import { loadShowSetupState } from "@/lib/owner/show-setup-state";
import "@/styles/features/awakening-program.css";
import "@/styles/features/awakening-program-mobile-standard.css";

export const dynamic = "force-dynamic";

const PROGRAM_PREVIEW_IMAGE = "/branding/awakening-lockup.png";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://vitalorgansent.com"),
  title: "Digital Program | 300 Awakening",
  description: "Interactive digital event program for 300 Awakening.",
  alternates: {
    canonical: "/program",
  },
  openGraph: {
    title: "Digital Program | 300 Awakening",
    description: "View the 300 Awakening digital program.",
    url: "/program",
    siteName: "300 Awakening",
    type: "website",
    images: [
      {
        url: PROGRAM_PREVIEW_IMAGE,
        width: 1536,
        height: 1024,
        alt: "Ian Craig and 300 Awakening logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Program | 300 Awakening",
    description: "View the 300 Awakening digital program.",
    images: [PROGRAM_PREVIEW_IMAGE],
  },
};

export default async function AwakeningProgramPage() {
  const [countdownConfig, showSetup] = await Promise.all([
    loadActiveCountdownConfig(),
    loadShowSetupState(),
  ]);

  return (
    <AwakeningProgramClient
      initialCountdownDetails={{
        ...countdownConfig,
        eventLocation: showSetup.eventLocation,
        livestreamAvailability: showSetup.livestreamAvailability,
      }}
    />
  );
}
