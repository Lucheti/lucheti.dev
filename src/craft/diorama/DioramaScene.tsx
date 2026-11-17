"use client";

import { Html } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useState, type ReactNode, type RefObject } from "react";
import { PCFShadowMap, type Object3D } from "three";
import type { DioramaScreen as DioramaScreenContent } from "@/content";
import type { DioramaParts } from "./composeDiorama";
import type { DioramaDirector } from "./DioramaDirector";
import type { DioramaBehaviour } from "./DioramaMode";
import { DioramaScreen } from "./DioramaScreen";
import { stageDiorama } from "./stageDiorama";
import type { Target } from "./Target";

type SceneProps = Readonly<{
  parts: DioramaParts;
  screen: DioramaScreenContent;
  behaviour: DioramaBehaviour;
  /**
   * The element the live screen's DOM is mounted in: the box holding the canvas, so it shares the canvas's
   * stacking context and sits under it. It must exist before the scene mounts and never change.
   */
  host: RefObject<HTMLElement | null>;
  /** The island is on screen: with idle life on, render every frame; otherwise only on demand. */
  running: boolean;
  /** The first frame has been drawn; the scene can replace the fallback. */
  onReady: () => void;
  /** The WebGL context was lost; the fallback should come back. */
  onLost: () => void;
  /** The pointer moved onto a clickable piece, or off every one. */
  onHover: (target: Target | null) => void;
}>;

/** How many frames to draw after the live screen mounts, so drei can measure and place it. */
const SETTLE_FRAMES = 3;
/** A press that travelled further than this, in pixels, was a drag, not a click. */
const CLICK_SLOP = 6;

/** The target a hit box answers to, if the pointer hit one. */
function targetOf(object: Object3D): Target | null {
  const target: unknown = object.userData.target;
  return typeof target === "object" && target !== null && "kind" in target ? (target as Target) : null;
}

/** Hands each frame to the director, keeps rendering while something moves, and tells the stage once the first frame is drawn. */
function Rig({ parts, director, behaviour, onReady }: Readonly<{ parts: DioramaParts; director: DioramaDirector; behaviour: DioramaBehaviour; onReady: () => void }>): ReactNode {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    parts.waker.bind(() => invalidate());
    return () => parts.waker.unbind();
  }, [parts, invalidate]);

  // On demand, a frame renders only when asked: ask whenever the behaviour changes so the pose catches up.
  useEffect(() => invalidate(), [invalidate, behaviour]);

  useFrame((state, delta) => {
    const { first, busy } = director.frame({
      camera: state.camera,
      renderer: state.gl,
      width: state.size.width,
      height: state.size.height,
      delta,
      behaviour,
    });
    if (first) {
      onReady();
    }
    if (busy) {
      invalidate();
    }
  });

  return null;
}

/**
 * The live screen: the little app as real DOM, laid on the monitor with a CSS 3D transform and cut out of the
 * canvas so anything in front of it still covers it.
 */
function LiveScreen({ parts, screen, host }: Readonly<{ parts: DioramaParts; screen: DioramaScreenContent; host: RefObject<HTMLElement | null> }>): ReactNode {
  const anchor = parts.layout.screen();
  const invalidate = useThree((state) => state.invalidate);
  // drei lays the DOM out in its frame callback, a frame or two after it mounts: draw those frames.
  const onShown = useCallback(() => invalidate(SETTLE_FRAMES), [invalidate]);
  return (
    <Html
      transform
      occlude="blending"
      geometry={<planeGeometry args={[anchor.width, anchor.height]} />}
      portal={host as RefObject<HTMLElement>}
      distanceFactor={parts.layout.screenDistanceFactor()}
      position={[anchor.centre.x, anchor.centre.y, anchor.centre.z]}
      zIndexRange={[10, 0]}
      pointerEvents="none"
    >
      <DioramaScreen screen={screen} state={parts.state} width={anchor.pixels.width} height={anchor.pixels.height} onShown={onShown} />
    </Html>
  );
}

/**
 * The diorama's WebGL canvas: the toon island under a fixed orthographic camera, with baked shadows, the
 * live screen on the monitor, and pointer events on its pieces' hit boxes. It renders every frame only while
 * on screen and alive; otherwise on demand, while something still moves.
 */
export default function DioramaScene({ parts, screen, behaviour, host, running, onReady, onLost, onHover }: SceneProps): ReactNode {
  const [stage] = useState(() => stageDiorama(parts));
  useEffect(() => () => stage.dispose(), [stage]);
  const { director } = stage;

  const hover = (target: Target | null): void => {
    director.hover(target);
    onHover(target);
    parts.waker.wake();
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    hover(targetOf(event.object));
  };
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    const target = targetOf(event.object);
    if (target === null || event.delta > CLICK_SLOP || parts.gesture.active()) {
      return;
    }
    event.stopPropagation();
    parts.switchboard.press(target);
  };

  return (
    <Canvas
      orthographic
      flat
      dpr={[1, behaviour.maxDpr]}
      shadows={{ type: PCFShadowMap, autoUpdate: false }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [12, 10, 14], zoom: 60, near: 0.1, far: 80 }}
      frameloop={running && behaviour.idle ? "always" : "demand"}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", onLost);
      }}
      onPointerMissed={() => hover(null)}
    >
      <primitive object={stage.model.island()} onPointerMove={onPointerMove} onPointerOut={() => hover(null)} onClick={onClick}>
        <LiveScreen parts={parts} screen={screen} host={host} />
      </primitive>
      <Rig parts={parts} director={director} behaviour={behaviour} onReady={onReady} />
    </Canvas>
  );
}
