import { MathUtils } from "three";
import type { ChapterId, ChapterPosition } from "@/story";

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

const WIDE_TABLE: PoseTable = {
  hero: { x: 0.74, y: 0.5, scale: 0.85, assembly: 0.0, spin: 0.0 },
  method: { x: 0.77, y: 0.52, scale: 0.9, assembly: 0.35, spin: 0.7 },
  work: { x: 0.86, y: 0.46, scale: 0.72, assembly: 0.68, spin: 1.5 },
  lab: { x: 0.75, y: 0.5, scale: 0.95, assembly: 0.9, spin: 2.3 },
  // Comes to rest over the bright core of the backdrop's final frames.
  contact: { x: 0.76, y: 0.47, scale: 1.05, assembly: 1.0, spin: 3.1 },
};

// On a single column the object sits behind the text, so it stays small and high.
const NARROW_ANCHOR = { x: 0.5, y: 0.26 } as const;
const NARROW_SCALE = 0.62;

/** Canvases narrower than this (CSS px) use the single-column table. */
export const NARROW_BELOW_PX = 1024;

function narrowTable(): PoseTable {
  const narrow = (pose: Readonly<PoseValues>): Readonly<PoseValues> => ({
    ...pose,
    ...NARROW_ANCHOR,
    scale: pose.scale * NARROW_SCALE,
  });
  return {
    hero: narrow(WIDE_TABLE.hero),
    method: narrow(WIDE_TABLE.method),
    work: narrow(WIDE_TABLE.work),
    lab: narrow(WIDE_TABLE.lab),
    contact: narrow(WIDE_TABLE.contact),
  };
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

  /** Writes the pose at `position` into `out`: chapter pose → upcoming pose by the eased blend. */
  public sample(position: ChapterPosition, out: PoseValues): void {
    const from = this.table[position.chapter()];
    const to = this.table[position.upcoming()];
    const blend = position.blend().eased();
    out.x = blend.mix(from.x, to.x);
    out.y = blend.mix(from.y, to.y);
    out.scale = blend.mix(from.scale, to.scale);
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
