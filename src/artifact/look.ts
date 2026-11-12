/**
 * Every number that decides how the artifact looks, in one place.
 * Tune here; the components only read these.
 *
 * The object lives on warm paper for most of the page and on graphite in the
 * Agents chapter, so it uses normal (not additive) blending: additive light
 * turns white on a light page.
 */
export const LOOK = {
  signal: "#ff5a1f",
  nodeCore: "#ff5a1f",
  shard: { color: "#2a2a27", roughness: 0.62, metalness: 0.18 },
  camera: { fov: 35, distance: 8 },
  ambient: { intensity: 0.9 },
  key: { color: "#ffffff", intensity: 2.4, position: [-4, 5, 4] as const },
  /** Orange light from below and in front; the rim on the graphite shards. */
  underlight: { intensity: 16, distance: 9, position: [0.6, -2.4, 2.8] as const },
  core: {
    radius: 0.09,
    lightFrom: 2,
    lightTo: 14,
    // Grows until it nearly fills the hollow shell, so the seams glow orange.
    scaleFrom: 0.4,
    scaleTo: 5.2,
  },
  halo: { size: 7, depth: -1.6, opacityFrom: 0.0, opacityTo: 0.16 },
  threads: { opacityScattered: 0.75, opacityAssembled: 0.2 },
  /** Hairlines along the shell's edges that light up as the last shards close. */
  seams: { radius: 0.992, opacity: 0.95 },
  nodes: { dotSize: 0.06, glowSize: 0.22, glowOpacity: 0.35 },
  motion: { turnRadiansPerSecond: 0.05, poseLambda: 4, tiltX: 0.22, tiltY: 0.32 },
} as const;
