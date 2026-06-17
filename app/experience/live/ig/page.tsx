import type { Metadata } from "next";
import IgLivePreviewClient from "@/components/experience/live/ig/IgLivePreviewClient";

export const metadata: Metadata = {
  title: "IG Live Preview | 300 Awakening",
  description: "Instagram-style live viewer layout preview for 300 Awakening.",
};

export default function IgLivePreviewPage() {
  return <IgLivePreviewClient />;
}
