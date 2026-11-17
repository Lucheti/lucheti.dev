"use client";

import { Component, type ReactNode } from "react";

type BoundaryProps = Readonly<{
  /** Called once when the scene fails, e.g. so a stage can keep its fallback drawing. */
  onError?: () => void;
  children: ReactNode;
}>;

/**
 * Catches a WebGL scene that cannot start (no context, a lost context, a shader error), so the page keeps
 * working without it instead of breaking.
 */
export class SceneBoundary extends Component<BoundaryProps, Readonly<{ failed: boolean }>> {
  public state = { failed: false };

  public static getDerivedStateFromError(): Readonly<{ failed: boolean }> {
    return { failed: true };
  }

  public componentDidCatch(): void {
    this.props.onError?.();
  }

  public render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
