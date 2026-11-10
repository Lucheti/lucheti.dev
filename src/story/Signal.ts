export type Unsubscribe = () => void;

/** A value that changes over time and can be read or observed. */
export interface Signal<T> {
  current(): T;
  subscribe(listener: (value: T) => void): Unsubscribe;
}

/** The writable side of a Signal. Only its owner should hold this type. */
export class Emitter<T> implements Signal<T> {
  private readonly listeners: Set<(value: T) => void> = new Set();

  public constructor(
    private value: T,
    private readonly same: (a: T, b: T) => boolean,
  ) {}

  public current(): T {
    return this.value;
  }

  public subscribe(listener: (value: T) => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(next: T): void {
    if (this.same(this.value, next)) {
      return;
    }
    this.value = next;
    this.listeners.forEach((listener) => listener(next));
  }
}
