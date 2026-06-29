import type { Metadata } from "next";
import AwakeningProgramClient from "@/components/experience/program/AwakeningProgramClient";
import "@/styles/features/awakening-program.css";

export const metadata: Metadata = {
  title: "Interactive Program | 300 Awakening",
  description:
    "The cinematic mobile-first event program for the AWAKENING live recording experience.",
};

export default function AwakeningProgramPage() {
  return <AwakeningProgramClient />;
}
