"use client";

import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";

type CreateAccountErrorBoundaryProps = {
  children: ReactNode;
};

type CreateAccountErrorBoundaryState = {
  hasError: boolean;
};

/** Prevents a client render fault from blanking the entire /create-account route. */
export default class CreateAccountErrorBoundary extends Component<
  CreateAccountErrorBoundaryProps,
  CreateAccountErrorBoundaryState
> {
  state: CreateAccountErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CreateAccountErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[CREATE_ACCOUNT_RENDER_ERR]:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-brand-black px-6 py-12 text-center">
          <p className="font-headline text-xl uppercase tracking-[0.12em] text-white">
            Create Account Unavailable
          </p>
          <p className="mt-3 max-w-md font-body text-sm text-brand-muted">
            Something interrupted the signup form. Refresh the page or return to log in and try
            again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="touch-target rounded-xl border border-brand-blue/45 bg-brand-blue/12 px-5 py-2.5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-blue"
            >
              Refresh Page
            </button>
            <Link
              href="/login"
              className="touch-target rounded-xl border border-brand-border px-5 py-2.5 font-ui text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-muted"
            >
              Back to Log In
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
