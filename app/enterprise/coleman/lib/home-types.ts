export type ChordBlock = {
  id: string;
  chord: string;
  roman: string;
  isActive: boolean;
};

export type VoicingPill = {
  id: string;
  label: string;
};

export type ColemanHomeSession = {
  noteLabel: string;
  currentKey: string;
  keyQuality: string;
  keyBadge: string;
  flatBadge: { symbol: string; label: string };
  sharpBadge: { symbol: string; label: string };
  progressionTitle: string;
  barCount: number;
  progression: ChordBlock[];
  intelligence: {
    isLive: boolean;
    functionLabel: string;
    functionValue: string;
    cadenceLabel: string;
    cadenceValue: string;
    cadencePercent: number;
    dialPrimary: string;
    dialSecondary: string;
    nashvilleLabel: string;
    nashvilleValue: string;
    scaleDegreeLabel: string;
    scaleDegreeValue: string;
    voicings: VoicingPill[];
  };
};
