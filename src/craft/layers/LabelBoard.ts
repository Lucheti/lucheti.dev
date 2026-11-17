/** The parts of one label the board moves: the whole label, pinned at the column, and its leader. */
type LabelParts = { root: HTMLElement | null; leader: HTMLElement | null; x: number; y: number; reach: number; opacity: number };

/** Opacity changes smaller than this are not worth a style write. */
const OPACITY_STEP = 0.01;

/**
 * Moves the layer labels drawn over the stage. Each label sits in the column at its layer's height, its
 * leader reaching back to the layer's corner. Positions are rounded to whole pixels so the text and the
 * hairline stay sharp, and a style is only written when it changes, so a still frame costs nothing.
 */
export class LabelBoard {
  private readonly parts: LabelParts[];

  public constructor(count: number) {
    this.parts = Array.from({ length: count }, () => ({ root: null, leader: null, x: Number.NaN, y: Number.NaN, reach: Number.NaN, opacity: Number.NaN }));
  }

  /** Hands the board label `index`'s element; React calls this from a ref, with null on unmount. */
  public attachRoot(index: number, element: HTMLElement | null): void {
    this.parts[index].root = element;
    this.forget(index);
  }

  /** Hands the board label `index`'s leader line. */
  public attachLeader(index: number, element: HTMLElement | null): void {
    this.parts[index].leader = element;
    this.forget(index);
  }

  /** Pins label `index` at (`columnX`, `anchorY`) with its leader reaching back to `anchorX`, at `opacity`. */
  public place(index: number, anchorX: number, anchorY: number, columnX: number, opacity: number): void {
    const part = this.parts[index];
    const x = Math.round(columnX);
    const y = Math.round(anchorY);
    const reach = Math.max(0, x - Math.round(anchorX));
    const shown = Math.round(opacity / OPACITY_STEP) * OPACITY_STEP;
    if (part.root !== null && (x !== part.x || y !== part.y)) {
      part.root.style.transform = `translate(${x}px, ${y}px)`;
      part.x = x;
      part.y = y;
    }
    if (part.root !== null && shown !== part.opacity) {
      part.root.style.opacity = String(shown);
      part.opacity = shown;
    }
    if (part.leader !== null && reach !== part.reach) {
      part.leader.style.width = `${reach}px`;
      part.reach = reach;
    }
  }

  private forget(index: number): void {
    const part = this.parts[index];
    part.x = Number.NaN;
    part.y = Number.NaN;
    part.reach = Number.NaN;
    part.opacity = Number.NaN;
  }
}
