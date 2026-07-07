import type { Metadata } from "next";
import { PLATFORM_APP_NAME } from "@/lib/theme/brand";

export const metadata: Metadata = {
  title: `Owner | ${PLATFORM_APP_NAME}`,
  robots: { index: false, follow: false },
};

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
