import { hop, pulse, ring, squash } from "./curves";
import type { DioramaLayout, SteamPiece } from "./DioramaLayout";
import type { DioramaModel } from "./DioramaModel";
import type { DioramaState } from "./DioramaState";
import type { FloatingCard } from "./FloatingCard";
import type { IdleLoops } from "./IdleLoops";
import type { TargetKind } from "./Target";

/** Where the idle life is frozen when nothing may move by itself: a pleasant moment, the card half open. */
const STILL_MOMENT = 2.2;
const STILL_OPENNESS = 0.55;
/** How wide the card opens when popped. */
const POPPED = 1.75;

/**
 * Poses the island's props from its idle life and their reactions: the duck bobs and, when clicked, hops
 * and squashes; the plant sways and wiggles; steam rises off the mug; the cloud drifts past the window; the
 * floating card breathes apart and back, and pops wide open when clicked. It also hands new tasks to the
 * screen as they arrive.
 */
export class PropPoser {
  private delivered = 0;

  public constructor(
    private readonly layout: DioramaLayout,
    private readonly model: DioramaModel,
    private readonly card: FloatingCard,
    private readonly idle: IdleLoops,
    private readonly state: DioramaState,
  ) {}

  /** Poses the props at idle time `seconds`; `alive` says whether the idle life plays. `age` gives each reaction's age. */
  public pose(seconds: number, alive: boolean, age: (kind: TargetKind) => number): void {
    const t = alive ? seconds : STILL_MOMENT;

    const duck = this.model.piece("duck");
    const duckSquash = squash(age("duck"), 0.34);
    duck.position.y += (alive ? this.idle.bob(t) : 0) + hop(age("duck") - 0.08, 0.42) * 0.17;
    duck.scale.set(duckSquash.wide, duckSquash.tall, duckSquash.wide);
    duck.rotation.y = 0.5 * ring(age("duck") - 0.1, 1.2, 2.5);

    const leaves = this.model.piece("plant-leaves");
    leaves.rotation.z = (alive ? this.idle.sway(t, 0) : 0) + 0.3 * ring(age("plant"), 2.1, 2.6);
    leaves.rotation.x = (alive ? this.idle.sway(t, 1.9) * 0.7 : 0) + 0.14 * ring(age("plant") - 0.07, 2.1, 2.6);
    const pot = squash(age("plant"), 0.1);
    this.model.piece("plant-pot").scale.set(pot.wide, pot.tall, pot.wide);

    for (let puff = 0; puff < this.idle.puffs(); puff += 1) {
      const step = this.idle.steam(puff, t);
      const group = this.model.piece(`steam-${puff + 1}` as SteamPiece);
      group.position.x += step.drift;
      group.position.y += step.rise;
      group.scale.setScalar(Math.max(1e-4, step.size));
      group.visible = step.size > 0.02;
    }

    const { from, to } = this.layout.cloudPath();
    const pass = this.idle.cloud(alive ? t : STILL_MOMENT * 4);
    const cloud = this.model.piece("cloud");
    cloud.position.z = from + (to - from) * pass.across;
    cloud.scale.setScalar(Math.max(1e-4, pass.size));
    cloud.visible = pass.size > 0.02;

    const breath = alive ? this.idle.breathe(t) : STILL_OPENNESS;
    const pop = Math.min(1, pulse(age("card"), 0.06, 0.7) * 1.6);
    const openness = breath + (POPPED - breath) * pop;
    const rise = alive ? 0.045 * Math.sin((2 * Math.PI * t) / 6.5) : 0;
    const rock = (alive ? 0.06 * Math.sin((2 * Math.PI * t) / 11) : 0) + 0.3 * ring(age("card"), 1.4, 2.6);
    this.card.pose(openness, rise, rock);

    if (alive) {
      const arrived = this.idle.arrivals(t);
      while (this.delivered < arrived) {
        this.delivered += 1;
        this.state.receive();
      }
    }
  }
}
