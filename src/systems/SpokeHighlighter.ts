/**
 * Lights the spoke the saga is currently using. It writes a data attribute straight on
 * the SVG element, so highlighting never goes through React state during playback.
 */
export class SpokeHighlighter {
  private readonly spokes: (Element | null)[] = [];
  private active: number | null = null;

  public register(index: number, element: Element | null): void {
    this.spokes[index] = element;
    if (element !== null && index === this.active) {
      element.setAttribute("data-active", "true");
    }
  }

  public activate(index: number | null): void {
    if (index === this.active) {
      return;
    }
    if (this.active !== null) {
      this.spokes[this.active]?.removeAttribute("data-active");
    }
    this.active = index;
    if (index !== null) {
      this.spokes[index]?.setAttribute("data-active", "true");
    }
  }
}
