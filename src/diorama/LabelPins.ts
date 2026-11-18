import type { Point3 } from "./space";

/** A callback ref for one element. */
export type PinRef = (element: HTMLElement | null) => void;

/**
 * Pins crisp HTML labels to points on an island, each under a key of the island's own. React renders the
 * labels once, in a layer over the canvas, and binds each to its key here; every frame the scene projects
 * each pin's point to the canvas and moves its element there by transform alone, so the labels turn with
 * the island and cost no renders.
 */
export class LabelPins<Key extends string> {
  private readonly elements = new Map<Key, HTMLElement>();
  private readonly binders = new Map<Key, PinRef>();

  public constructor(private readonly anchors: ReadonlyMap<Key, Point3>) {}

  /** A stable callback ref for the label at `key`. */
  public bind(key: Key): PinRef {
    if (!this.anchors.has(key)) {
      throw new Error(`No pin ${key}`);
    }
    let binder = this.binders.get(key);
    if (binder === undefined) {
      binder = (element) => {
        if (element === null) {
          this.elements.delete(key);
        } else {
          this.elements.set(key, element);
        }
      };
      this.binders.set(key, binder);
    }
    return binder;
  }

  /** Visits every label on the page with the island point it is pinned to. */
  public each(visit: (anchor: Point3, element: HTMLElement) => void): void {
    this.elements.forEach((element, key) => visit(this.anchors.get(key) as Point3, element));
  }
}
