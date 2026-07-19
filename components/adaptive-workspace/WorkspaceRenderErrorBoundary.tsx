"use client";

/**
 * Local Settings Workspace Render Error Boundary — Phase 2F.
 * Protects only the Workspace render layer; falls back to children without app-wide overlay.
 * Hard React render crashes may remount the child — continuity is not guaranteed after catch.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";

export type WorkspaceRenderErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (info: { message: string }) => void;
};

type State = { hasError: boolean };

export default class WorkspaceRenderErrorBoundary extends Component<
  WorkspaceRenderErrorBoundaryProps,
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError?.({
      message: error?.message ? String(error.message) : "AW.RENDER.BOUNDARY",
    });
    if (process.env.NODE_ENV !== "production") {
      // Development diagnostic only — no user overlay.
      console.warn("[AW Settings] render boundary caught", error?.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
