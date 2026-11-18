"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  NormalBlending,
  EdgesGeometry,
  IcosahedronGeometry,
  MathUtils,
  MeshStandardMaterial,
  type Group,
  type LineBasicMaterial,
  type Mesh,
  type PointLight,
  type SpriteMaterial,
} from "three";
import { AssemblyChoreography } from "./AssemblyChoreography";
import { createGlowTexture } from "./glowTexture";
import { LOOK } from "./look";
import { PointerLean } from "./PointerLean";
import { ShardField } from "./ShardField";
import { ThreadNetwork } from "./ThreadNetwork";

type Props = Readonly<{ reducedMotion: boolean }>;

/** The object's diameter as a share of the smaller side of its canvas. */
const FILL = 0.78;
/** The object is always whole: every shard is home. */
const ASSEMBLED = 1;

/**
 * The assembled object, centred in its own canvas: shards, threads, travelling nodes, core and halo. It
 * turns slowly and leans toward the pointer; it does not move with the scroll. Thin on purpose; the maths
 * lives in the pure classes it drives.
 */
export function ArtifactRig({ reducedMotion }: Props): ReactNode {
  const [field] = useState(() => new ShardField());
  const [choreography] = useState(() => new AssemblyChoreography(field));
  const [poses] = useState(() => choreography.allocate());
  const [threads] = useState(() => new ThreadNetwork(field.neighbourPairs()));
  const [lean] = useState(() => new PointerLean());
  const [glow] = useState(() => createGlowTexture());
  const [seams] = useState(() => {
    const shell = new IcosahedronGeometry(LOOK.seams.radius, 0);
    const edges = new EdgesGeometry(shell);
    shell.dispose();
    return edges;
  });
  const [shardMaterial] = useState(
    () =>
      new MeshStandardMaterial({
        color: LOOK.shard.color,
        roughness: LOOK.shard.roughness,
        metalness: LOOK.shard.metalness,
        flatShading: true,
      }),
  );

  const outer = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const meshes = useRef<Array<Mesh | null>>([]);
  const lineMaterial = useRef<LineBasicMaterial>(null);
  const seamMaterial = useRef<LineBasicMaterial>(null);
  const core = useRef<Mesh>(null);
  const coreLight = useRef<PointLight>(null);
  const halo = useRef<SpriteMaterial>(null);

  useEffect(() => {
    if (reducedMotion) return undefined;
    return lean.listen(window);
  }, [lean, reducedMotion]);

  useEffect(
    () => () => {
      field.dispose();
      threads.dispose();
      glow.dispose();
      seams.dispose();
      shardMaterial.dispose();
    },
    [field, threads, glow, seams, shardMaterial],
  );

  useFrame((state, delta) => {
    const seconds = Math.min(delta, 0.05);
    const liveliness = reducedMotion ? 0 : 1;
    const time = state.clock.elapsedTime;

    lean.settle(seconds);

    const frame = outer.current;
    const spinner = inner.current;
    if (!frame || !spinner) return;
    frame.scale.setScalar((FILL * Math.min(state.viewport.width, state.viewport.height)) / 2);
    frame.rotation.set(-lean.y() * LOOK.motion.tiltX, lean.x() * LOOK.motion.tiltY, 0);
    spinner.rotation.y = time * LOOK.motion.turnRadiansPerSecond * liveliness;

    const input = { assembly: ASSEMBLED, time, pointerX: lean.x(), pointerY: lean.y(), liveliness };
    for (let i = 0; i < poses.length; i++) {
      choreography.place(i, input, poses[i]);
      const mesh = meshes.current[i];
      if (mesh) {
        mesh.position.copy(poses[i].position);
        mesh.quaternion.copy(poses[i].quaternion);
      }
    }

    threads.stretch(poses);
    if (!reducedMotion) threads.advance(time);

    const a = ASSEMBLED;
    if (lineMaterial.current) {
      lineMaterial.current.opacity = MathUtils.lerp(LOOK.threads.opacityScattered, LOOK.threads.opacityAssembled, a);
    }
    // The threads hand over to the seams: they only light once the shards are nearly home.
    if (seamMaterial.current) seamMaterial.current.opacity = LOOK.seams.opacity * Math.pow(a, 8);
    // Cubed so the core stays a spark while the shards are apart and only swells as the shell closes round it.
    if (core.current) core.current.scale.setScalar(MathUtils.lerp(LOOK.core.scaleFrom, LOOK.core.scaleTo, a * a * a));
    if (coreLight.current) coreLight.current.intensity = MathUtils.lerp(LOOK.core.lightFrom, LOOK.core.lightTo, a);
    if (halo.current) halo.current.opacity = MathUtils.lerp(LOOK.halo.opacityFrom, LOOK.halo.opacityTo, a);
  });

  return (
    <>
      <ambientLight intensity={LOOK.ambient.intensity} />
      <directionalLight color={LOOK.key.color} intensity={LOOK.key.intensity} position={LOOK.key.position} />

      <group ref={outer}>
        <pointLight
          color={LOOK.signal}
          intensity={LOOK.underlight.intensity}
          distance={LOOK.underlight.distance}
          decay={2}
          position={LOOK.underlight.position}
        />
        <pointLight ref={coreLight} color={LOOK.signal} intensity={LOOK.core.lightFrom} decay={2} />
        <mesh ref={core}>
          <sphereGeometry args={[LOOK.core.radius, 24, 16]} />
          <meshBasicMaterial color={LOOK.signal} toneMapped={false} />
        </mesh>
        <sprite position={[0, 0, LOOK.halo.depth]} scale={[LOOK.halo.size, LOOK.halo.size, 1]}>
          <spriteMaterial
            ref={halo}
            map={glow}
            color={LOOK.signal}
            transparent
            depthWrite={false}
            blending={NormalBlending}
            opacity={LOOK.halo.opacityFrom}
            toneMapped={false}
          />
        </sprite>

        <group ref={inner}>
          {poses.map((_, i) => (
            <mesh
              key={i}
              ref={(mesh: Mesh | null) => {
                meshes.current[i] = mesh;
              }}
              geometry={field.geometry(i)}
              material={shardMaterial}
            />
          ))}

          <lineSegments geometry={threads.lines()} frustumCulled={false}>
            <lineBasicMaterial
              ref={lineMaterial}
              color={LOOK.signal}
              transparent
              depthWrite={false}
              blending={NormalBlending}
              opacity={LOOK.threads.opacityScattered}
              toneMapped={false}
            />
          </lineSegments>

          <lineSegments geometry={seams}>
            <lineBasicMaterial
              ref={seamMaterial}
              color={LOOK.signal}
              transparent
              depthWrite={false}
              blending={NormalBlending}
              opacity={0}
              toneMapped={false}
            />
          </lineSegments>

          {!reducedMotion && (
            <>
              <points
                geometry={threads.nodes()}
                frustumCulled={false}
              >
                <pointsMaterial
                  map={glow}
                  color={LOOK.signal}
                  size={LOOK.nodes.glowSize}
                  transparent
                  opacity={LOOK.nodes.glowOpacity}
                  depthWrite={false}
                  blending={NormalBlending}
                  toneMapped={false}
                />
              </points>
              <points
                geometry={threads.nodes()}
                frustumCulled={false}
              >
                <pointsMaterial
                  map={glow}
                  color={LOOK.nodeCore}
                  size={LOOK.nodes.dotSize}
                  transparent
                  depthWrite={false}
                  blending={NormalBlending}
                  toneMapped={false}
                />
              </points>
            </>
          )}
        </group>
      </group>
    </>
  );
}
