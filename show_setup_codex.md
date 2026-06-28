# 300 Awakening - SHOW SET UP SETTINGS Codex

### System Architecture & Brand Matrix Reference

This document is a local implementation guide for the production show setup model. It is documentation only and does not change app behavior.

```ts
export interface LowerThirdAsset {
  id: string;
  primaryText: string;
  secondaryText: string;
  theme: "NEON_PURPLE_SLIDE" | "MINIMAL_GLASS_FADE" | "CYAN_GLOW";
}

export interface ProgramSegment {
  id: string;
  title: string;
  durationMinutes: number;
}

export interface ShowSetupState {
  // Module 1: Core Chronos Engine
  showTitle: string;
  presenterName: string;
  targetDateTime: string; // ISO string feeding countdown clock
  gateControl: "LOCKED" | "EARLY_ACCESS";

  // Module 2: Stream Ingestion Path
  primaryIngestEndpoint: string; // Read-only view
  streamKey: string;
  fallbackAssetPath: string;

  // Module 3: Dynamic Lower-Thirds
  lowerThirds: LowerThirdAsset[];

  // Module 4: Order of Service Array
  programFlow: ProgramSegment[];

  // Module 5: Platform Monetization & Tiers
  monetizationEnabled: boolean;
  gateType: "PAYWALL" | "FREE_REGISTRATION" | "PUBLIC";
  ticketPricingGA: number;
  ticketPricingVIP: number;

  // Module 6: Operational Infrastructure Toggles
  chatEnabled: boolean;
  chatSlowMode: boolean;
  dvrBufferEnabled: boolean;
  verboseTelemetry: boolean;
}
```
