import type { Metadata } from "next";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const metadata: Metadata = {
  title: `Entry Hub | ${PLATFORM_APP_NAME}`,
  description: "Select your entry path — attendee experience or production team login.",
};

export default function EmailGateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
