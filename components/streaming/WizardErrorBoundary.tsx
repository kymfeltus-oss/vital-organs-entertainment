"use client";

import { Component, type ReactNode } from "react";
import { TS } from "@/components/todays-service/ServiceUi";

type WizardErrorBoundaryProps = {
  children: ReactNode;
  stepLabel?: string;
};

type WizardErrorBoundaryState = {
  error: Error | null;
};

/** Catches step render crashes so the wizard shell and footer stay usable. */
export default class WizardErrorBoundary extends Component<
  WizardErrorBoundaryProps,
  WizardErrorBoundaryState
> {
  state: WizardErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WizardErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[StreamingSetupWizard] step render error", error);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-red-500/35 bg-red-950/25 p-4">
          <p className="font-body text-sm text-red-200">
            {this.props.stepLabel
              ? `Could not load the ${this.props.stepLabel} step.`
              : "Something went wrong on this step."}
          </p>
          <button
            type="button"
            className={`mt-3 ${TS.btnOutline}`}
            onClick={() => this.setState({ error: null })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
