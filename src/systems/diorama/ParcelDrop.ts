type Fall = { height: number; speed: number };

/**
 * Parcels falling into place under gravity: each one, known by id, drops from where it appeared (or from
 * where it sat) to the height it is told to rest at, landing with no bounce. Ids it is not told about any
 * more are forgotten. A pure stepper: time comes in through `step`.
 */
export class ParcelDrop {
  private readonly falls = new Map<number, Fall>();
  private readonly resting = new Map<number, number>();

  /** `gravity` in island units per second squared; new parcels appear at `spawn` height. */
  public constructor(
    private readonly gravity: number,
    private readonly spawn: number,
  ) {
    if (!(gravity > 0)) {
      throw new Error(`Gravity must pull down: ${gravity}`);
    }
  }

  /** Parcel `id` should come to rest at `height`. */
  public restAt(id: number, height: number): void {
    this.resting.set(id, height);
    if (!this.falls.has(id)) {
      this.falls.set(id, { height: Math.max(this.spawn, height), speed: 0 });
    }
  }

  /** Lets `seconds` pass, and forgets every parcel not told where to rest since the last step. */
  public step(seconds: number): void {
    for (const id of [...this.falls.keys()]) {
      if (!this.resting.has(id)) {
        this.falls.delete(id);
      }
    }
    const dt = Math.max(0, seconds);
    this.falls.forEach((fall, id) => {
      const target = this.resting.get(id) as number;
      if (fall.height <= target) {
        fall.height = target;
        fall.speed = 0;
        return;
      }
      fall.speed += this.gravity * dt;
      fall.height = Math.max(target, fall.height - fall.speed * dt);
      if (fall.height === target) {
        fall.speed = 0;
      }
    });
    this.resting.clear();
  }

  /** Where parcel `id` is now; its rest height if it is not falling, or the spawn height if unknown. */
  public height(id: number): number {
    return this.falls.get(id)?.height ?? this.spawn;
  }

  /** Whether any parcel is still in the air. */
  public falling(): boolean {
    for (const fall of this.falls.values()) {
      if (fall.speed !== 0) {
        return true;
      }
    }
    return false;
  }
}
