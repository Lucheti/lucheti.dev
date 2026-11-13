import { MathUtils } from "three";
import type { ChapterId, ChapterPosition, Progress } from "@/story";

/** Where the object is on screen and how assembled, for one moment of the story. */
export type PoseValues = {
  /** Anchor as a fraction of the viewport; y runs top to bottom. */
  x: number;
  y: number;
  scale: number;
  assembly: number;
  spin: number;
};

type PoseTable = Readonly<Record<ChapterId, Readonly<PoseValues>>>;

/**
 * The object is a scattered cloud in the hero, folds away (scale 0) through
 * the middle chapters, and re-forms whole beside the contact line.
 */
const WIDE_TABLE: PoseTable = {
  // A small loose cluster in the empty top-right corner, clear of the face.
  hero: { x: 0.9, y: 0.3, scale: 0.3, assembly: 0.0, spin: 0.0 },
  timeline: { x: 0.92, y: 0.2, scale: 0.0, assembly: 0.4, spin: 1.0 },
  craft: { x: 0.92, y: 0.2, scale: 0.0, assembly: 0.6, spin: 1.6 },
  systems: { x: 0.8, y: 0.45, scale: 0.0, assembly: 0.85, spin: 2.0 },
  // The department board fills the Agents chapter, so the object waits for contact.
  orchestra: { x: 0.78, y: 0.5, scale: 0.0, assembly: 1.0, spin: 2.6 },
  contact: { x: 0.78, y: 0.5, scale: 0.9, assembly: 1.0, spin: 3.4 },
};

/** Single column: only where nothing sits under it. */
const NARROW_TABLE: PoseTable = {
  // The phone hero is name, face and copy stacked edge to edge: no free corner.
  hero: { x: 0.5, y: 0.2, scale: 0.0, assembly: 0.0, spin: 0.0 },
  timeline: { x: 0.5, y: 0.2, scale: 0.0, assembly: 0.4, spin: 1.0 },
  craft: { x: 0.5, y: 0.2, scale: 0.0, assembly: 0.6, spin: 1.6 },
  systems: { x: 0.5, y: 0.3, scale: 0.0, assembly: 0.85, spin: 2.0 },
  orchestra: { x: 0.76, y: 0.79, scale: 0.0, assembly: 1.0, spin: 2.6 },
  contact: { x: 0.76, y: 0.79, scale: 0.0, assembly: 1.0, spin: 3.4 },
};

/** Share of a chapter transition over which the object folds or unfolds. */
const FOLD_SPAN = 0.3;

/** Canvases narrower than this (CSS px) use the single-column table. */
export const NARROW_BELOW_PX = 1024;

function narrowTable(): PoseTable {
  return NARROW_TABLE;
}

/** Interpolates between the per-chapter poses as the reader travels the story. */
export class PoseTrack {
  public constructor(private readonly table: PoseTable) {}

  public static wide(): PoseTrack {
    return new PoseTrack(WIDE_TABLE);
  }

  public static narrow(): PoseTrack {
    return new PoseTrack(narrowTable());
  }

  public static forCanvasWidth(cssPixels: number): PoseTrack {
    return cssPixels < NARROW_BELOW_PX ? PoseTrack.narrow() : PoseTrack.wide();
  }

  /**
   * The object may only overlap a chapter where it is meant to be visible. So
   * it unfolds in the last stretch before a chapter that shows it, and folds
   * away in the first stretch after one; elsewhere scale follows the blend.
   */
  private static foldBlend(travelled: Progress, fromScale: number, toScale: number): Progress {
    if (fromScale === 0 && toScale > 0) {
      return travelled.within(1 - FOLD_SPAN, 1).eased();
    }
    if (toScale === 0 && fromScale > 0) {
      return travelled.within(0, FOLD_SPAN).eased();
    }
    return travelled.eased();
  }

  /** Writes the pose at `position` into `out`: chapter pose → upcoming pose by the eased blend. */
  public sample(position: ChapterPosition, out: PoseValues): void {
    const from = this.table[position.chapter()];
    const to = this.table[position.upcoming()];
    const travelled = position.blend();
    const blend = travelled.eased();
    out.x = blend.mix(from.x, to.x);
    out.y = blend.mix(from.y, to.y);
    out.scale = PoseTrack.foldBlend(travelled, from.scale, to.scale).mix(from.scale, to.scale);
    out.assembly = blend.mix(from.assembly, to.assembly);
    out.spin = blend.mix(from.spin, to.spin);
  }
}

/** Chases a target pose with exponential damping so scrolling never snaps the object. */
export class PoseFollower {
  private readonly current: PoseValues = { x: 0.72, y: 0.5, scale: 1, assembly: 0, spin: 0 };
  private primed = false;

  public constructor(private readonly lambda: number) {}

  public follow(target: Readonly<PoseValues>, seconds: number): void {
    if (!this.primed) {
      Object.assign(this.current, target);
      this.primed = true;
      return;
    }
    const c = this.current;
    c.x = MathUtils.damp(c.x, target.x, this.lambda, seconds);
    c.y = MathUtils.damp(c.y, target.y, this.lambda, seconds);
    c.scale = MathUtils.damp(c.scale, target.scale, this.lambda, seconds);
    c.assembly = MathUtils.damp(c.assembly, target.assembly, this.lambda, seconds);
    c.spin = MathUtils.damp(c.spin, target.spin, this.lambda, seconds);
  }

  public values(): Readonly<PoseValues> {
    return this.current;
  }
}

/** Where to put the object in world units on the z = 0 plane. */
export type Placement = { x: number; y: number; scale: number };

const HEIGHT_SHARE = 0.42;
const WIDTH_CAP = 0.7;

/**
 * Converts a pose into world units for the current viewport.
 * Owns the sizing rule: the assembled diameter is 42% of the viewport height,
 * never more than 70% of its width.
 */
export class StageLayout {
  public static unitRadius(viewportWidth: number, viewportHeight: number): number {
    return Math.min((HEIGHT_SHARE * viewportHeight) / 2, (WIDTH_CAP * viewportWidth) / 2);
  }

  public place(viewportWidth: number, viewportHeight: number, pose: Readonly<PoseValues>, out: Placement): void {
    out.x = (pose.x - 0.5) * viewportWidth;
    out.y = (0.5 - pose.y) * viewportHeight;
    out.scale = pose.scale * StageLayout.unitRadius(viewportWidth, viewportHeight);
  }
}
