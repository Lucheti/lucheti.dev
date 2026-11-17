"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PCFShadowMap, type Object3D } from "three";
import type { QueueDioramaParts } from "./composeQueueDiorama";
import type { DioramaBehaviour } from "./kit";
import type { QueueDirector } from "./QueueDirector";
import { BUTTON_TARGET } from "./QueueModel";
import { stageQueue } from "./stageQueue";

type SceneProps = Readonly<{
  parts: QueueDioramaParts;
  behaviour: DioramaBehaviour;
  /** The island is on screen: render every frame; otherwise only on demand. */
  running: boolean;
  /** The first frame has been drawn; the scene can replace the 2D board. */
  onReady: () => void;
  /** The WebGL context was lost; the 2D board should come back. */
  onLost: () => void;
  /** The pointer moved onto the button, or off it. */
  onHover: (over: boolean) => void;
}>;

/** A press that travelled further than this, in pixels, was a drag, not a click. */
const CLICK_SLOP = 6;

/** Whether the pointer hit the button's hit box. */
function onButton(object: Object3D): boolean {
  return object.userData.target === BUTTON_TARGET;
}

type RigProps = Readonly<{ parts: QueueDioramaParts; director: QueueDirector; behaviour: DioramaBehaviour; onReady: () => void }>;

/** Hands each frame to the director, keeps rendering while something moves, and reports the first frame. */
function Rig({ parts, director, behaviour, onReady }: RigProps): ReactNode {
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
 * The queue diorama's WebGL canvas: the toon island under a fixed orthographic camera, with baked shadows,
 * and the pointer on the big button's hit box. It renders every frame while on screen; otherwise only on
 * demand. The labels are HTML over it, moved by the director.
 */
export default function QueueScene({ parts, behaviour, running, onReady, onLost, onHover }: SceneProps): ReactNode {
  const [stage] = useState(() => stageQueue(parts));
  useEffect(() => () => stage.dispose(), [stage]);
  const { director } = stage;
  // The canvas forces its context lost when it unmounts; only a loss while it is still up is a failure.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const hover = (over: boolean): void => {
    director.hover(over);
    onHover(over);
    parts.waker.wake();
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>): void => {
    event.stopPropagation();
    hover(onButton(event.object));
  };
  const onClick = (event: ThreeEvent<MouseEvent>): void => {
    if (!onButton(event.object) || event.delta > CLICK_SLOP || parts.gesture.active()) {
      return;
    }
    event.stopPropagation();
    parts.button.press();
  };

  return (
    <Canvas
      orthographic
      flat
      dpr={[1, behaviour.maxDpr]}
      shadows={{ type: PCFShadowMap, autoUpdate: false }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [12, 10, 14], zoom: 50, near: 0.1, far: 80 }}
      frameloop={running ? "always" : "demand"}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", () => {
          if (mounted.current) {
            onLost();
          }
        });
      }}
      onPointerMissed={() => hover(false)}
    >
      <primitive object={stage.model.island()} onPointerMove={onPointerMove} onPointerOut={() => hover(false)} onClick={onClick} />
      <Rig parts={parts} director={director} behaviour={behaviour} onReady={onReady} />
    </Canvas>
  );
}
