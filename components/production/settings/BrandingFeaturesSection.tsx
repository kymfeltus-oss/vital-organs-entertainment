"use client";

import ThemeToggleSwitch from "@/components/admin/branding/ThemeToggleSwitch";
import type { ThemeFeatureFlags } from "@/lib/theme/types";

type BrandingFeaturesSectionProps = {
  features: ThemeFeatureFlags;
  disabled?: boolean;
  onFeatureChange: (key: keyof ThemeFeatureFlags, value: boolean) => void;
};

const FEATURE_TOGGLES: {
  key: keyof ThemeFeatureFlags;
  label: string;
  description: string;
}[] = [
  { key: "showLive", label: "Live stream", description: "Show Live in navigation and dashboard." },
  { key: "showGiving", label: "Giving", description: "Enable the giving tab and quick action." },
  { key: "showBuySeeds", label: "Buy Seeds", description: "Show seed packs and wallet purchases." },
  { key: "showMusic", label: "Music", description: "Expose the music library tab." },
  { key: "showPrayer", label: "Contact & Prayer", description: "Show contact / prayer quick action." },
  { key: "showStory", label: "Featured story", description: "Display the hero story card on home." },
];

export default function BrandingFeaturesSection({
  features,
  disabled = false,
  onFeatureChange,
}: BrandingFeaturesSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
        Feature gates map to <code className="font-mono text-xs">theme.features</code> and control
        which attendee modules appear in navigation.
      </p>
      {FEATURE_TOGGLES.map((toggle) => (
        <div key={toggle.key} className={disabled ? "pointer-events-none opacity-60" : undefined}>
          <ThemeToggleSwitch
            id={`owner-feature-${toggle.key}`}
            label={toggle.label}
            description={toggle.description}
            checked={features[toggle.key]}
            onChange={(checked) => onFeatureChange(toggle.key, checked)}
          />
        </div>
      ))}
    </div>
  );
}
