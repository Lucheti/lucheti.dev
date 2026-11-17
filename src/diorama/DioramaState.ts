import { STAR_COUNT } from "./Target";

/** The screen's colour scheme. */
export type Theme = "light" | "dark";

/** How big the screen's text and rows are, smallest first. */
export type Density = "snug" | "cosy" | "roomy";

/** The slider's steps, left to right. */
export const DENSITIES: readonly Density[] = ["snug", "cosy", "roomy"];

/** Everything the screen and the controls show, at one moment. */
export type DioramaView = Readonly<{
  theme: Theme;
  /** How many toasts have popped; each new one shows once. */
  toasts: number;
  density: Density;
  /** The selected task's stars, 0 to `STAR_COUNT`. */
  rating: number;
  /** Whether the selected task is done. */
  done: boolean;
  lampOn: boolean;
  /** How many tasks have arrived since the screen came on. */
  arrivals: number;
}>;

const FIRST_VIEW: DioramaView = { theme: "light", toasts: 0, density: "cosy", rating: 3, done: false, lampOn: true, arrivals: 0 };

/**
 * The diorama's one piece of state, read by both the 3D controls and the screen. It changes only through
 * what the visitor (or the room's own life) does: flip the theme, pop a toast, step the density, rate or
 * finish the selected task, switch the lamp, or receive a new task. Every change makes a new view and tells
 * whoever is listening.
 */
export class DioramaState {
  private view: DioramaView = FIRST_VIEW;
  private readonly listeners = new Set<() => void>();

  /** Listens for changes; returns the way to stop. Bound, so it can be handed to `useSyncExternalStore`. */
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** The current view. Bound, and the same object until something changes. */
  public readonly snapshot = (): DioramaView => this.view;

  /** The toggle: light becomes dark and dark becomes light. */
  public flipTheme(): void {
    this.change({ theme: this.view.theme === "light" ? "dark" : "light" });
  }

  /** The orange button: a toast pops up on the screen. */
  public popToast(): void {
    this.change({ toasts: this.view.toasts + 1 });
  }

  /** The slider: one step bigger, and from the biggest back to the smallest. */
  public stepDensity(): void {
    const next = (DENSITIES.indexOf(this.view.density) + 1) % DENSITIES.length;
    this.change({ density: DENSITIES[next] });
  }

  /** The stars: the selected task gets `stars` of them; clicking its current rating again clears it. */
  public rate(stars: number): void {
    if (!Number.isInteger(stars) || stars < 1 || stars > STAR_COUNT) {
      throw new Error(`A rating is a whole number of stars from 1 to ${STAR_COUNT}: ${stars}`);
    }
    this.change({ rating: stars === this.view.rating ? 0 : stars });
  }

  /** The checkbox: the selected task is done, or not done again. */
  public toggleDone(): void {
    this.change({ done: !this.view.done });
  }

  /** The lamp: on becomes off, and off becomes on. */
  public switchLamp(): void {
    this.change({ lampOn: !this.view.lampOn });
  }

  /** A new task arrives on the screen by itself. */
  public receive(): void {
    this.change({ arrivals: this.view.arrivals + 1 });
  }

  private change(patch: Partial<DioramaView>): void {
    this.view = { ...this.view, ...patch };
    this.listeners.forEach((listener) => listener());
  }
}
