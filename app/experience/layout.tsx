import type { Metadata } from "next";
import { PLATFORM_APP_NAME, PLATFORM_TAGLINE } from "@/lib/theme/brand";

export const metadata: Metadata = {
  title: `Experience | ${PLATFORM_APP_NAME}`,
  description: PLATFORM_TAGLINE,
};

export default function ExperienceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
