import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experience | 300 Awakening",
  description: "300 Awakening master stage experience.",
};

export default function ExperienceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
