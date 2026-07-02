"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type LiveFeatureErrorBoundaryProps = {
  children: ReactNode;
  featureLabel: string;
};

type LiveFeatureErrorBoundaryState = {
  hasError: boolean;
};

/** Isolates chat/reaction UI failures from the main video player. */
export default class LiveFeatureErrorBoundary extends Component<
  LiveFeatureErrorBoundaryProps,
  LiveFeatureErrorBoundaryState
> {
  state: LiveFeatureErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LiveFeatureErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[live] ${this.props.featureLabel} error`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <p
          className="pointer-events-none px-3 py-2 font-body text-xs text-white/45 backdrop-blur-sm"
          role="status"
        >
          {this.props.featureLabel} unavailable — stream continues.
        </p>
      );
    }

    return this.props.children;
  }
}
