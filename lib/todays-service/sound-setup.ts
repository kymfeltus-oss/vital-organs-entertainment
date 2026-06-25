import type { SoundCategory } from "@/lib/todays-service/types";

export type MixerChoice =
  | "Behringer X32"
  | "Midas M32"
  | "Allen & Heath"
  | "Yamaha"
  | "Other"
  | "I'm not sure";

export const MIXER_OPTIONS: MixerChoice[] = [
  "Behringer X32",
  "Midas M32",
  "Allen & Heath",
  "Yamaha",
  "Other",
  "I'm not sure",
];

export type MixerOptionMeta = {
  id: MixerChoice;
  brandLabel: string;
  brandStyle: string;
  recommended?: boolean;
  helper?: string;
  subtitle?: string;
};

export const MIXER_OPTION_META: MixerOptionMeta[] = [
  {
    id: "Behringer X32",
    brandLabel: "BEHRINGER",
    brandStyle: "text-[#e85d04] border-[#e85d04]/40 bg-[#e85d04]/10",
    recommended: true,
    helper: "Most common setup for churches using an X32 console.",
  },
  {
    id: "Midas M32",
    brandLabel: "MIDAS",
    brandStyle: "text-[#c9a227] border-[#c9a227]/40 bg-[#c9a227]/10",
  },
  {
    id: "Allen & Heath",
    brandLabel: "A&H",
    brandStyle: "text-[#00a8ff] border-[#00a8ff]/40 bg-[#00a8ff]/10",
  },
  {
    id: "Yamaha",
    brandLabel: "YAMAHA",
    brandStyle: "text-[#6b7280] border-white/20 bg-white/5",
  },
  {
    id: "Other",
    brandLabel: "OTHER",
    brandStyle: "text-white/60 border-white/15 bg-black/30",
  },
  {
    id: "I'm not sure",
    brandLabel: "?",
    brandStyle: "text-[#00f2ff] border-[#00f2ff]/30 bg-[#00f2ff]/5",
    subtitle: "Parable will help identify it.",
  },
];

export type SoundSourcePreset = {
  label: string;
  category: SoundCategory;
};

export const SOUND_SOURCE_PRESETS: SoundSourcePreset[] = [
  { label: "Pastor Microphone", category: "pastor_mic" },
  { label: "Worship Leader Microphone", category: "microphone" },
  { label: "Choir Microphones", category: "choir_mic" },
  { label: "Keyboard", category: "band_input" },
  { label: "Organ", category: "band_input" },
  { label: "Bass", category: "band_input" },
  { label: "Drums", category: "band_input" },
  { label: "Audience Microphones", category: "microphone" },
];

export const MIXER_IMPORT_OPTIONS = [
  { key: "channelNames" as const, label: "Channel Names" },
  { key: "channelLabels" as const, label: "Channel Labels" },
  { key: "userLabels" as const, label: "User Labels" },
  { key: "routing" as const, label: "Routing" },
  { key: "scenes" as const, label: "Scenes" },
  { key: "dcaGroups" as const, label: "DCA Groups" },
  { key: "muteGroups" as const, label: "Mute Groups" },
];

export function mixerChoiceNeedsConnectionForm(choice: MixerChoice | ""): boolean {
  return choice === "Behringer X32" || choice === "Midas M32";
}

export function defaultMixerName(choice: MixerChoice | ""): string {
  if (choice === "I'm not sure") return "Sound Mixer";
  if (choice === "Other") return "Mixer";
  return choice || "Mixer";
}
