/** Seconds from some fixed moment, only ever growing. */
export interface Seconds {
  now(): number;
}

/** The browser's high-resolution clock, in seconds. */
export class BrowserSeconds implements Seconds {
  public now(): number {
    return performance.now() / 1000;
  }
}
