import type { LucideIcon } from "lucide-react";
import { HandHeart, Heart, ListOrdered } from "lucide-react";

export type ExperienceActionId = "prayer" | "give" | "program" | null;

export const EXPERIENCE_ACTIONS: {
  id: Exclude<ExperienceActionId, null>;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "prayer", label: "Prayer", icon: HandHeart },
  { id: "give", label: "Give", icon: Heart },
  { id: "program", label: "Event Program", icon: ListOrdered },
];
