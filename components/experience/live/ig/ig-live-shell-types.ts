import type { ReactNode } from "react";
import type { IgLiveWaitingState } from "@/components/experience/live/ig/IgLiveWaitingStage";

export type IgLiveShellMode = "live" | "waiting";

export type IgLiveShellProps = {
  mode: IgLiveShellMode;
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  waiting: IgLiveWaitingState;
};

export type IgLiveSurfaceProps = {
  mode: IgLiveShellMode;
  showPaywall: boolean;
  paywallOverlay?: ReactNode;
  waiting: IgLiveWaitingState;
};
