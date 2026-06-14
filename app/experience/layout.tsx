import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experience Hub | 300 Awakening",
  description: "Attendee event hub — live show, prayer, giving, music, and updates.",
};

export default function ExperienceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
