import type { FramePainter } from "./FlightPainter";
import type { FlightView } from "./types";

const NONE: readonly FlightView[] = [];

/**
 * Keeps the messages in the air from the latest frame for a renderer that draws on its own beat (the 3D
 * diorama reads them in its render loop). Cleared, it holds none.
 */
export class FlightRelay implements FramePainter {
  private latest: readonly FlightView[] = NONE;

  /** Keeps this frame's flights. */
  public paint(flights: readonly FlightView[]): void {
    this.latest = flights;
  }

  /** Forgets them: nothing is in the air to draw. */
  public clear(): void {
    this.latest = NONE;
  }

  /** The flights of the latest frame. */
  public flights(): readonly FlightView[] {
    return this.latest;
  }
}

/** Hands every frame to several painters, so the 2D board and the 3D diorama can draw the same flights. */
export class PainterFan implements FramePainter {
  public constructor(private readonly painters: readonly FramePainter[]) {
    if (painters.length === 0) {
      throw new Error("A painter fan needs at least one painter");
    }
  }

  /** Paints the flights with every painter. */
  public paint(flights: readonly FlightView[]): void {
    this.painters.forEach((painter) => painter.paint(flights));
  }

  /** Clears every painter. */
  public clear(): void {
    this.painters.forEach((painter) => painter.clear());
  }
}
