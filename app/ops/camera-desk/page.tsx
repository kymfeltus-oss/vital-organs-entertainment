import type { Metadata } from "next";
import CameraDeskPageClient from "@/components/ops/CameraDeskPageClient";

export const metadata: Metadata = {
  title: "Camera Mobile Desk | 300 Awakening Ops",
  description:
    "Phone-optimized operator console for camera crew — monitor, switch sources, and manage failover.",
};

export default function CameraDeskPage() {
  return <CameraDeskPageClient />;
}
