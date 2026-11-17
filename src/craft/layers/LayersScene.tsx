"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Vector3 } from "three";
import type { LayersToy } from "./composeLayersToy";
import type { Vec2 } from "./IsometricView";
import type { StageFit } from "./StageFit";
import { StackMeshes } from "./StackMeshes";

type SceneProps = Readonly<{
  toy: LayersToy;
  /** The breath plays only while this is true: the panel is on screen and motion is allowed. */
  running: boolean;
  /** Reduced motion: hold the exploded still frame. */
  still: boolean;
  /** The WebGL context exists; the scene can replace the fallback. */
  onReady: () => void;
  /** The context was lost; the fallback should come back. */
  onLost: () => void;
}>;

/** How far the camera stands back along its view direction; orthographic, so only the clipping planes care. */
const CAMERA_DISTANCE = 20;
/** The longest step the clock takes in one frame, in seconds, so a hitch never jumps the breath ahead. */
const MAX_STEP = 0.05;

/** The fit last applied to the camera, and the canvas size it was made for. */
type AppliedFit = { width: number; height: number; fit: StageFit };

/**
 * Drives the stack each frame from the pure choreography: lifts the layers, sways and leans the model, fades
 * the ripple and pins the DOM labels. The camera is refitted only when the canvas changes size.
 */
function LayersRig({ toy, running, still }: Readonly<{ toy: LayersToy; running: boolean; still: boolean }>): ReactNode {
  const [meshes] = useState(() => new StackMeshes(toy.blueprint, toy.choreography.ripples(), toy.view.right()));
  const [point] = useState<Vec2>(() => ({ x: 0, y: 0 }));
  const clock = useRef(toy.choreography.stillMs());
  const applied = useRef<AppliedFit | null>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => () => meshes.dispose(), [meshes]);

  // On demand, a frame only renders when asked: ask once whenever the mode changes so the pose catches up.
  useEffect(() => invalidate(), [invalidate, running, still]);

  useFrame((state, delta) => {
    const { size, camera } = state;
    let current = applied.current;
    if (current === null || current.width !== size.width || current.height !== size.height) {
      const fit = toy.stage.fit(size);
      const right = toy.view.right();
      const up = toy.view.up();
      const back = toy.view.toCamera();
      const target = new Vector3(right.x, right.y, right.z)
        .multiplyScalar(fit.lookX())
        .addScaledVector(new Vector3(up.x, up.y, up.z), fit.lookY());
      camera.position.copy(target).addScaledVector(new Vector3(back.x, back.y, back.z), CAMERA_DISTANCE);
      camera.lookAt(target);
      camera.zoom = fit.zoom();
      camera.updateProjectionMatrix();
      meshes.resize(size.width, size.height);
      current = { width: size.width, height: size.height, fit };
      applied.current = current;
    }

    const step = Math.min(delta, MAX_STEP);
    if (running) {
      clock.current += step * 1000;
      toy.tilt.settle(step);
    }
    const { choreography, stage, labels, tilt } = toy;
    const time = still ? choreography.stillMs() : clock.current;
    const yaw = still ? 0 : stage.yaw(time, tilt.x());
    const lean = still ? 0 : stage.tilt(tilt.y());
    meshes.orient(yaw, lean);

    const layerCount = toy.blueprint.layers().length;
    for (let layer = 0; layer < layerCount; layer += 1) {
      meshes.lift(layer, choreography.lift(layer, time));
      stage.labelPoint(layer, time, yaw, lean, current.fit, point);
      labels.place(layer, point.x, point.y, current.fit.column(), choreography.labelOpacity(layer, time));
    }
    for (let ring = 0; ring < meshes.ripples(); ring += 1) {
      meshes.ripple(ring, choreography.rippleScale(ring, time), choreography.rippleOpacity(ring, time));
    }
  });

  return <primitive object={meshes.object()} />;
}

/**
 * The Layers panel's WebGL canvas: orthographic, transparent, untoned so the paints land as specified, and
 * at most twice the CSS resolution. It renders every frame only while running; otherwise on demand.
 */
export default function LayersScene({ toy, running, still, onReady, onLost }: SceneProps): ReactNode {
  return (
    <Canvas
      orthographic
      flat
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      camera={{ position: [CAMERA_DISTANCE, CAMERA_DISTANCE, CAMERA_DISTANCE], zoom: 40, near: 0.1, far: CAMERA_DISTANCE * 3 }}
      frameloop={running ? "always" : "demand"}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onLost);
        onReady();
      }}
    >
      <LayersRig toy={toy} running={running} still={still} />
    </Canvas>
  );
}
