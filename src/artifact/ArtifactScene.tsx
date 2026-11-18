"use client";

import { Canvas } from "@react-three/fiber";
import { useSyncExternalStore, type ReactNode } from "react";
import { ArtifactRig } from "./ArtifactRig";
import { LOOK } from "./look";

type Props = Readonly<{
  reducedMotion: boolean;
  /** The canvas is on screen: draw every frame; otherwise draw nothing. */
  running: boolean;
}>;

function subscribeToVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const isTabVisible = (): boolean => document.visibilityState === "visible";

/**
 * The WebGL canvas. The reduced-motion flag arrives as a prop because React context does not cross into
 * the R3F reconciler. It draws only while the tab is visible and the canvas is on screen.
 */
export default function ArtifactScene({ reducedMotion, running }: Props): ReactNode {
  const visible = useSyncExternalStore(subscribeToVisibility, isTabVisible, () => true);

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: LOOK.camera.fov, position: [0, 0, LOOK.camera.distance], near: 0.1, far: 60 }}
      frameloop={visible && running ? "always" : "never"}
      style={{ pointerEvents: "none" }}
    >
      <ArtifactRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
