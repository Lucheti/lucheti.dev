"use client";

import { ContactShadows, Environment, Html, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useState, type ReactNode, type RefObject } from "react";
import { NeutralToneMapping, Object3D, PCFShadowMap } from "three";
import type { RoomScreen as RoomScreenContent } from "@/content";
import type { Progress, Signal } from "@/story";
import { CardStacks } from "./CardStacks";
import { ClayMeshes } from "./ClayMeshes";
import { CLAY, LIGHT } from "./clay";
import type { Room } from "./composeRoom";
import { RoomDirector } from "./RoomDirector";
import type { RoomBehaviour } from "./RoomMode";
import { RoomScreen } from "./RoomScreen";

type SceneProps = Readonly<{
  room: Room;
  screen: RoomScreenContent;
  progress: Signal<Progress>;
  behaviour: RoomBehaviour;
  /**
   * The element the live screen's DOM is mounted in: the stage box holding the canvas, so it shares the
   * canvas's stacking context and sits under it. It must exist before the scene mounts and never change.
   */
  host: RefObject<HTMLElement | null>;
  /** The room is on screen: render every frame; otherwise only on demand. */
  running: boolean;
  /** The first frame has been drawn; the scene can replace the fallback. */
  onReady: () => void;
  /** The WebGL context was lost; the fallback should come back. */
  onLost: () => void;
}>;

/** The desk lamp's brightness, in candela, and the daylight's. */
const LAMP_LEVEL = 1.8;
const SUN_LEVEL = 2.1;
/** How many frames to draw after the live screen mounts, so drei can measure and place it. */
const SETTLE_FRAMES = 3;

/** Hands each frame to the director, and tells the stage once the first one is drawn. */
function RoomRig({
  director,
  progress,
  behaviour,
  onReady,
}: Readonly<{ director: RoomDirector; progress: Signal<Progress>; behaviour: RoomBehaviour; onReady: () => void }>): ReactNode {
  const invalidate = useThree((state) => state.invalidate);

  // On demand, a frame renders only when asked: ask whenever the behaviour changes so the pose catches up.
  useEffect(() => invalidate(), [invalidate, behaviour]);

  useFrame((state, delta) => {
    const first = director.frame({
      camera: state.camera,
      renderer: state.gl,
      width: state.size.width,
      height: state.size.height,
      delta,
      progress: progress.current().toNumber(),
      behaviour,
    });
    if (first) {
      onReady();
    }
  });

  return null;
}

/** Soft studio light from shapes, rendered once into the environment map: no image is fetched. */
function Studio(): ReactNode {
  return (
    <Environment frames={1} resolution={256} environmentIntensity={0.85}>
      <color attach="background" args={["#d6d4ce"]} />
      <Lightformer form="rect" intensity={1.6} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
      <Lightformer form="rect" intensity={2.2} position={[-6, 4, 6]} scale={[6, 4, 1]} target={[0, 1, 0]} />
      <Lightformer form="rect" intensity={0.9} position={[7, 2.5, 3]} scale={[4, 4, 1]} target={[0, 1, 0]} />
      <Lightformer form="rect" intensity={0.5} color="#ffe6cc" position={[0, 1.5, -6]} scale={[8, 3, 1]} target={[0, 1, 0]} />
    </Environment>
  );
}

/** The room's lights: daylight from the open right side, casting soft shadows across onto the back wall, and the warm desk lamp. */
function Lights({ room, onLamp }: Readonly<{ room: Room; onLamp: RoomDirector["attachLamp"] }>): ReactNode {
  const [aim] = useState(() => new Object3D());
  const { bulb, aim: spot } = room.layout.lamp();

  useEffect(() => {
    aim.position.set(spot.x, spot.y, spot.z);
    aim.updateMatrixWorld();
  }, [aim, spot]);

  return (
    <>
      <directionalLight
        color={LIGHT.sun}
        intensity={SUN_LEVEL}
        position={[6, 7.5, 2.5]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={5}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={1}
        shadow-camera-far={25}
      />
      <primitive object={aim} />
      <spotLight
        ref={onLamp}
        color={LIGHT.lamp}
        intensity={LAMP_LEVEL}
        position={[bulb.x, bulb.y, bulb.z]}
        target={aim}
        angle={0.85}
        penumbra={1}
        decay={2}
        distance={0}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-radius={6}
      />
    </>
  );
}

/**
 * The live screen: the inbox as real DOM, laid on the monitor with a CSS 3D transform and cut out of the
 * canvas so props in front still cover it. It mounts in a host fixed from the start: left to itself, drei
 * moves it once the canvas's event target connects, and that second mount can come up empty.
 */
function LiveScreen({ room, screen, host }: Readonly<{ room: Room; screen: RoomScreenContent; host: RefObject<HTMLElement | null> }>): ReactNode {
  const anchor = room.layout.screen();
  const invalidate = useThree((state) => state.invalidate);
  // drei lays the DOM out in its frame callback, a frame or two after it mounts: draw those frames.
  const onShown = useCallback(() => invalidate(SETTLE_FRAMES), [invalidate]);
  return (
    <Html
      transform
      occlude="blending"
      portal={host as RefObject<HTMLElement>}
      distanceFactor={room.layout.screenDistanceFactor()}
      position={[anchor.centre.x, anchor.centre.y, anchor.centre.z]}
      zIndexRange={[10, 0]}
    >
      <RoomScreen screen={screen} width={anchor.pixels.width} height={anchor.pixels.height} onShown={onShown} />
    </Html>
  );
}

/** The model: the room's clay and the floating cards, built once and freed on unmount. */
function Model({ room, cards }: Readonly<{ room: Room; cards: CardStacks }>): ReactNode {
  const [clay] = useState(() => new ClayMeshes(room.layout.solids()));
  useEffect(() => () => clay.dispose(), [clay]);
  return (
    <>
      <primitive object={clay.object()} />
      <primitive object={cards.object()} />
    </>
  );
}

/**
 * The workbench room's WebGL canvas: a soft clay render lit by a procedural studio environment, daylight and
 * a desk lamp, with baked soft shadows, a contact shadow under the plinth and the live screen on the monitor.
 * It renders every frame only while on screen; otherwise on demand.
 */
export default function RoomScene({ room, screen, progress, behaviour, host, running, onReady, onLost }: SceneProps): ReactNode {
  const [cards] = useState(() => new CardStacks(room.blueprint, room.layout.cards(), room.explode, room.idle));
  const [director] = useState(() => new RoomDirector(room, cards));
  useEffect(() => () => cards.dispose(), [cards]);
  const animated = behaviour.scroll || behaviour.idle;

  return (
    <Canvas
      dpr={[1, behaviour.maxDpr]}
      shadows={{ type: PCFShadowMap, autoUpdate: false }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 22, near: 0.05, far: 120, position: [12, 13, 18] }}
      frameloop={running && animated ? "always" : "demand"}
      onCreated={({ gl }) => {
        gl.toneMapping = NeutralToneMapping;
        gl.toneMappingExposure = 1;
        gl.domElement.addEventListener("webglcontextlost", onLost);
      }}
    >
      <Studio />
      <Lights room={room} onLamp={director.attachLamp} />
      <Model room={room} cards={cards} />
      <ContactShadows position={[0, -0.302, 0]} scale={15} resolution={1024} blur={2.6} far={2.5} opacity={0.3} color={CLAY.ink.color} frames={1} />
      <LiveScreen room={room} screen={screen} host={host} />
      <RoomRig director={director} progress={progress} behaviour={behaviour} onReady={onReady} />
    </Canvas>
  );
}
