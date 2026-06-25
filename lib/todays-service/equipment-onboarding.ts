import type { MixerConnectionStatusDb } from "@/lib/database/mixers";
import type { MixerConnectionTypeChoice } from "@/lib/todays-service/mixer-connection";

export type EquipmentOnboardingSectionId =
  | "mixer"
  | "camera"
  | "presentation"
  | "streaming"
  | "recording"
  | "internet"
  | "complete";

export type EquipmentOnboardingProgress = {
  currentSection: EquipmentOnboardingSectionId;
  mixerWizardStep: number;
  completedSections: EquipmentOnboardingSectionId[];
};

export type TenantEquipmentProfile = {
  tenantId: string;
  preferredConnectionType: MixerConnectionTypeChoice | null;
  rememberConnectionChoice: boolean;
  preferredNetwork: import("@/lib/internet/types").PreferredChurchNetwork | null;
  recommendedBroadcastPlatform: import("@/lib/streaming/types").StreamingPlatform;
  onboarding: EquipmentOnboardingProgress;
  updatedAt: string;
};

export const EQUIPMENT_ONBOARDING_SECTIONS: {
  id: EquipmentOnboardingSectionId;
  label: string;
}[] = [
  { id: "mixer", label: "Mixer" },
  { id: "camera", label: "Camera" },
  { id: "presentation", label: "Presentation" },
  { id: "streaming", label: "Streaming" },
  { id: "recording", label: "Recording" },
  { id: "internet", label: "Internet" },
  { id: "complete", label: "Complete" },
];

export const DEFAULT_EQUIPMENT_ONBOARDING: EquipmentOnboardingProgress = {
  currentSection: "mixer",
  mixerWizardStep: 1,
  completedSections: [],
};

/** Rough volunteer-friendly time remaining inside the mixer wizard */
export function estimateMixerWizardMinutesRemaining(step: number, skipImport: boolean): string {
  const weights: Record<number, number> = skipImport
    ? { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 8: 1, 9: 0 }
    : { 1: 2, 2: 2, 3: 2, 4: 2, 5: 1, 6: 2, 7: 1, 8: 1, 9: 0 };
  const minutes = Object.entries(weights).reduce((sum, [s, m]) => {
    return Number(s) >= step ? sum + m : sum;
  }, 0);
  if (minutes <= 0) return "Almost done";
  if (minutes === 1) return "About 1 minute remaining";
  return `About ${minutes} minutes remaining`;
}

export function shouldShowMixerImportStep(input: {
  mixerConnected: boolean;
  manualSetupReady: boolean;
  connectionStatus: MixerConnectionStatusDb | null | undefined;
  isDevelopmentMode: boolean;
}): boolean {
  if (input.isDevelopmentMode || input.manualSetupReady) return false;
  if (input.connectionStatus === "needs_attention") {
    return false;
  }
  return (
    input.mixerConnected ||
    input.connectionStatus === "connected" ||
    input.connectionStatus === "detected"
  );
}

export function nextStepAfterConnectionSummary(showImport: boolean): number {
  return showImport ? 6 : 8;
}

export function previousStepFromHealthCheck(showImport: boolean): number {
  return showImport ? 7 : 5;
}

export function previousStepFromConfigureInputs(showImport: boolean): number {
  return showImport ? 6 : 5;
}

export function shouldSkipConnectionTypeStep(profile: TenantEquipmentProfile | null): boolean {
  if (!profile?.rememberConnectionChoice) return false;
  return Boolean(profile.preferredConnectionType);
}
