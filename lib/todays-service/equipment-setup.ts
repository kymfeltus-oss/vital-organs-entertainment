/**
 * Equipment Setup Wizard — step registry.
 * Add future equipment phases by registering new step modules here
 * without changing the wizard shell or total step count contract.
 */

export const EQUIPMENT_WIZARD_TOTAL_STEPS = 9;

export type EquipmentWizardStepId =
  | "welcome"
  | "choose-mixer"
  | "connection-type"
  | "connect-mixer"
  | "connection-summary"
  | "import-mixer"
  | "configure-inputs"
  | "health-check"
  | "setup-complete";

export type EquipmentWizardStep = {
  number: number;
  id: EquipmentWizardStepId;
  label: string;
  /** Future: cameras, presentation, streaming, etc. attach to these categories */
  category: "general" | "mixer" | "inputs" | "verification" | "complete";
};

export const EQUIPMENT_WIZARD_STEPS: readonly EquipmentWizardStep[] = [
  { number: 1, id: "welcome", label: "Welcome", category: "general" },
  { number: 2, id: "choose-mixer", label: "Choose Mixer", category: "mixer" },
  { number: 3, id: "connection-type", label: "Connection Type", category: "mixer" },
  { number: 4, id: "connect-mixer", label: "Connect Mixer", category: "mixer" },
  { number: 5, id: "connection-summary", label: "Connection Summary", category: "mixer" },
  { number: 6, id: "import-mixer", label: "Import Mixer", category: "mixer" },
  { number: 7, id: "configure-inputs", label: "Configure Inputs", category: "inputs" },
  { number: 8, id: "health-check", label: "Run Health Check", category: "verification" },
  { number: 9, id: "setup-complete", label: "Setup Complete", category: "complete" },
] as const;

export function equipmentStepLabel(stepNumber: number): string {
  const step = EQUIPMENT_WIZARD_STEPS.find((s) => s.number === stepNumber);
  return step?.label ?? `Step ${stepNumber}`;
}

export const SCAN_PROGRESS_STEPS = [
  "Checking network...",
  "Looking for supported mixers...",
  "Listening for responses...",
] as const;

export const TEST_PROGRESS_STEPS = [
  "Network Reachable",
  "Mixer Responded",
  "Reading Mixer Information",
  "Reading Firmware",
  "Verifying Communication",
  "Connection Successful",
] as const;

/** Reserved for future wizard phases (cameras, streaming, etc.) */
export type FutureEquipmentPhase = {
  id: string;
  label: string;
  stepIds: EquipmentWizardStepId[];
};

export const FUTURE_EQUIPMENT_PHASES: FutureEquipmentPhase[] = [
  { id: "cameras", label: "Connect Cameras", stepIds: [] },
  { id: "presentation", label: "Connect Presentation", stepIds: [] },
  { id: "streaming", label: "Connect Streaming Computer", stepIds: [] },
  { id: "ptz", label: "Connect PTZ Controllers", stepIds: [] },
  { id: "internet", label: "Connect Internet", stepIds: [] },
  { id: "lighting", label: "Connect Lighting", stepIds: [] },
];

export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === "development";
}
