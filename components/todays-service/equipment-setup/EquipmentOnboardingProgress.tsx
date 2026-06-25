"use client";

import {
  EQUIPMENT_ONBOARDING_SECTIONS,
  type EquipmentOnboardingSectionId,
} from "@/lib/todays-service/equipment-onboarding";

type EquipmentOnboardingProgressProps = {
  currentSection: EquipmentOnboardingSectionId;
  completedSections: EquipmentOnboardingSectionId[];
};

export default function EquipmentOnboardingProgress({
  currentSection,
  completedSections,
}: EquipmentOnboardingProgressProps) {
  const completed = new Set(completedSections);

  return (
    <div className="border-b border-white/10 pb-3">
      <p className="font-ui text-[0.5rem] uppercase tracking-[0.14em] text-[#00f2ff]">Equipment Setup</p>
      <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
        {EQUIPMENT_ONBOARDING_SECTIONS.map((section) => {
          const isComplete = completed.has(section.id);
          const isCurrent = section.id === currentSection;
          return (
            <span
              key={section.id}
              className={`font-ui text-[0.48rem] uppercase tracking-[0.08em] ${
                isCurrent ? "text-white font-semibold" : isComplete ? "text-[#53fc18]" : "text-white/40"
              }`}
            >
              {isComplete ? `✓ ${section.label}` : section.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
