/** The cursors the island shows. */
export type CursorName = "default" | "pointer" | "grab" | "grabbing";

/**
 * Which cursor the island shows: a pointer over anything clickable, a closed hand while dragging, an open
 * hand over the rest when it can be dragged. Written straight to the element's style, so hovering never
 * re-renders anything.
 */
export class PointerCursor {
  private element: HTMLElement | null = null;
  private overTarget = false;
  private dragging = false;
  private draggable = false;

  /** The element whose cursor this sets. */
  public attach(element: HTMLElement | null): void {
    this.element = element;
    this.paint();
  }

  /** Whether the island can be dragged at all. */
  public allowDrag(draggable: boolean): void {
    this.draggable = draggable;
    this.paint();
  }

  /** The pointer is over something clickable, or not. */
  public hovering(overTarget: boolean): void {
    this.overTarget = overTarget;
    this.paint();
  }

  /** A drag started or ended. */
  public grabbing(dragging: boolean): void {
    this.dragging = dragging;
    this.paint();
  }

  /** The cursor for the current moment. */
  public cursor(): CursorName {
    if (this.dragging) {
      return "grabbing";
    }
    if (this.overTarget) {
      return "pointer";
    }
    return this.draggable ? "grab" : "default";
  }

  private paint(): void {
    if (this.element !== null) {
      this.element.style.cursor = this.cursor();
    }
  }
}
