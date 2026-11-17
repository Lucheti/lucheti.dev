import type { DiffusionMood } from "@/content";
import { assertNever } from "./SceneShapes";

/** The colours of one mood. */
export type Palette = Readonly<{
  skyTop: string;
  skyBottom: string;
  /** The sun or the moon. */
  glow: string;
  far: string;
  mid: string;
  ground: string;
  /** Dark silhouettes and shadows. */
  ink: string;
  /** Lit windows and lamps. */
  light: string;
  cloud: string;
  /** Pale painted surfaces: the tower, snow, a window sill. */
  paper: string;
  foliage: string;
  /** The wall and the table of the still life. */
  wall: Readonly<{ top: string; bottom: string }>;
  table: string;
}>;

/** The one accent every picture shares, the site's orange. */
export const ACCENT = "#ff5a1f";

/** Looks up the palette of a mood. */
export class PaletteBook {
  public static of(mood: DiffusionMood): Palette {
    switch (mood) {
      case "dusk":
        return {
          skyTop: "#4a3f7a",
          skyBottom: "#ff9a62",
          glow: "#ffd9a0",
          far: "#8a5a8c",
          mid: "#5d4380",
          ground: "#2f2a52",
          ink: "#241f45",
          light: "#ffe08a",
          cloud: "#f7b2a0",
          paper: "#f3d9c8",
          foliage: "#3f3d6b",
          wall: { top: "#f4d3c0", bottom: "#eab59c" },
          table: "#9c6a5a",
        };
      case "night":
        return {
          skyTop: "#0f1b3d",
          skyBottom: "#2c3f80",
          glow: "#f4efd0",
          far: "#2a3a75",
          mid: "#1d2a5e",
          ground: "#131c40",
          ink: "#0b1230",
          light: "#ffd86b",
          cloud: "#3a4a8c",
          paper: "#b9c2e6",
          foliage: "#17224f",
          wall: { top: "#33407a", bottom: "#243064" },
          table: "#2a335f",
        };
      case "morning":
        return {
          skyTop: "#8fd3ff",
          skyBottom: "#ffe9c2",
          glow: "#fff4b0",
          far: "#b9dcc9",
          mid: "#8cc7a6",
          ground: "#6bb58c",
          ink: "#3e6b66",
          light: "#ffffff",
          cloud: "#ffffff",
          paper: "#fffaf0",
          foliage: "#3f9a74",
          wall: { top: "#fff3df", bottom: "#fbe0c0" },
          table: "#d9a679",
        };
      case "storm":
        return {
          skyTop: "#4b5563",
          skyBottom: "#94a3b8",
          glow: "#cbd5e1",
          far: "#6b7686",
          mid: "#4f5a69",
          ground: "#2f3845",
          ink: "#1f2630",
          light: "#ffd86b",
          cloud: "#39424f",
          paper: "#cfd6df",
          foliage: "#2e4a48",
          wall: { top: "#aab4c2", bottom: "#8d99aa" },
          table: "#5a5f6b",
        };
      default:
        return assertNever(mood);
    }
  }
}
