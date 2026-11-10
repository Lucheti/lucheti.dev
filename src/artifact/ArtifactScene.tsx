"use client";

import { Canvas } from "@react-three/fiber";
import { useSyncExternalStore, type ReactNode } from "react";
import type { Story } from "@/story";
import { ArtifactRig } from "./ArtifactRig";
import { LOOK } from "./look";

type Props = Readonly<{ story: Story; reducedMotion: boolean }>;

function subscribeToVisibility(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const isTabVisible = (): boolean => document.visibilityState === "visible";

/**
 * The WebGL canvas. The story and the reduced-motion flag arrive as props
 * because React context does not cross into the R3F reconciler.
 */
export default function ArtifactScene({ story, reducedMotion }: Props): ReactNode {
  const visible = useSyncExternalStore(subscribeToVisibility, isTabVisible, () => true);

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: LOOK.camera.fov, position: [0, 0, LOOK.camera.distance], near: 0.1, far: 60 }}
      frameloop={visible ? "always" : "never"}
      style={{ pointerEvents: "none" }}
    >
      <ArtifactRig story={story} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
