/**
 * Every number that decides how the artifact looks, in one place.
 * Tune here; the components only read these.
 */
export const LOOK = {
  lime: "#c5f82a",
  nodeCore: "#f4ffc4",
  shard: { color: "#1c1e1b", roughness: 0.85, metalness: 0.1 },
  camera: { fov: 35, distance: 8 },
  ambient: { intensity: 0.05 },
  key: { color: "#c9cdc2", intensity: 0.7, position: [-4, 5, 4] as const },
  /** Lime light from below and in front; the underlighting on the matte shards. */
  underlight: { intensity: 34, distance: 9, position: [0.6, -2.4, 2.8] as const },
  core: {
    radius: 0.09,
    lightFrom: 2,
    lightTo: 14,
    scaleFrom: 0.6,
    scaleTo: 1.4,
  },
  halo: { size: 7, depth: -1.6, opacityFrom: 0.04, opacityTo: 0.22 },
  threads: { opacityScattered: 0.55, opacityAssembled: 0.12 },
  nodes: { dotSize: 0.07, glowSize: 0.3, glowOpacity: 0.55 },
  motion: { turnRadiansPerSecond: 0.05, poseLambda: 4, tiltX: 0.22, tiltY: 0.32 },
} as const;
