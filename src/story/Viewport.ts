import type { Unsubscribe } from "./Signal";

/** What the story needs to know about the scrolling surface. */
export interface Viewport {
  scrollTop(): number;
  /** Total distance the page can scroll; 0 when the page fits the screen. */
  scrollableDistance(): number;
  /** Fires whenever scroll position or layout size may have changed. */
  onChange(listener: () => void): Unsubscribe;
}

/** A point in the document that marks where a chapter begins. */
export interface ChapterAnchor {
  /** Distance from the top of the document, in CSS pixels. */
  top(): number;
}

export class BrowserViewport implements Viewport {
  public scrollTop(): number {
    return window.scrollY;
  }

  public scrollableDistance(): number {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  public onChange(listener: () => void): Unsubscribe {
    const observer = new ResizeObserver(listener);
    observer.observe(document.documentElement);
    window.addEventListener("scroll", listener, { passive: true });
    window.addEventListener("resize", listener, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", listener);
      window.removeEventListener("resize", listener);
    };
  }
}

export class ElementAnchor implements ChapterAnchor {
  public constructor(private readonly element: HTMLElement) {}

  public top(): number {
    return this.element.getBoundingClientRect().top + window.scrollY;
  }
}
