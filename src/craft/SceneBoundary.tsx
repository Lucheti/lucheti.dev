"use client";

import { Component, type ReactNode } from "react";

type BoundaryProps = Readonly<{ onError: () => void; children: ReactNode }>;

/** Catches a WebGL context that cannot be made, so the stage keeps its fallback drawing instead of breaking. */
export class SceneBoundary extends Component<BoundaryProps, Readonly<{ failed: boolean }>> {
  public state = { failed: false };

  public static getDerivedStateFromError(): Readonly<{ failed: boolean }> {
    return { failed: true };
  }

  public componentDidCatch(): void {
    this.props.onError();
  }

  public render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
