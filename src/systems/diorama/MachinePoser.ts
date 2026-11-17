import type { Group } from "three";
import type { ServiceView } from "../queue/types";
import { Approach, pulse, squash, type Point3 } from "./kit";
import { LAMP, LAMP_OFF } from "./palette";
import type { QueueModel } from "./QueueModel";
import type { MachineRig } from "./QueueLayout";
import { lampLit, lookOf } from "./ServiceLook";
import type { ServiceMotion } from "./ServiceMotion";
import { puffsAt } from "./Smoke";

/** How quickly a machine slumps over and stands back up, per second. */
const SLUMP_RATE = 7;
/** How hard a machine boings when it comes back from a restart. */
const BOING = 0.2;
/** How high a machine hops when it finishes a message. */
const FINISH_HOP = 0.045;

/**
 * Poses the three service machines from their status: the lamp's colour and blink, the hum, the busy
 * rattle and its burning fuse, the slump and smoke of a machine that is down, the boing when it comes
 * back, a small hop for each message finished, and the parcels waiting on its tray.
 */
export class MachinePoser {
  private readonly slumps: readonly Approach[];

  public constructor(
    private readonly model: QueueModel,
    private readonly rigs: readonly MachineRig[],
    private readonly motion: ServiceMotion,
    /** How long a busy machine holds out before it goes down, in seconds, for its fuse. */
    private readonly fuseSeconds: number,
  ) {
    this.slumps = rigs.map(() => new Approach(0, SLUMP_RATE));
  }

  /** Poses every machine for `services` at `now` (seconds), `seconds` after the last frame. */
  public pose(services: readonly ServiceView[], now: number, seconds: number, animate: boolean): void {
    this.motion.observe(
      services.map((service) => ({ kind: service.status.kind, processed: service.processed })),
      now,
    );
    services.forEach((service, index) => this.poseOne(index, service, now, seconds, animate));
  }

  private poseOne(index: number, service: ServiceView, now: number, seconds: number, animate: boolean): void {
    const rig = this.rigs[index];
    const parts = this.model.machine(index);
    const look = lookOf(service.status.kind);
    const inStatus = this.motion.inStatus(index, now);
    const live = animate ? 1 : 0;

    const slump = animate ? this.slumps[index].toward(look.slump, seconds) : this.slumps[index].snap(look.slump);
    const boing = squash(animate ? this.motion.sinceBack(index, now) : Number.POSITIVE_INFINITY, BOING);
    const hop = pulse(animate ? this.motion.sinceFinished(index, now) : Number.POSITIVE_INFINITY, 0.04, 0.1) * FINISH_HOP;
    const hum = Math.sin(now * Math.PI * 2 * 1.1 + index * 2.1) * look.hum * live;
    const rattle = Math.sin(now * Math.PI * 2 * 13 + index) * look.shake * live;
    const pivot = rig.body.pivot;
    parts.body.position.set(pivot.x + rattle, pivot.y + Math.max(0, hum) + hop, pivot.z);
    parts.body.rotation.set(slump * 0.35, 0, -slump);
    parts.body.scale.set(boing.wide, boing.tall, boing.wide);

    const colour = LAMP[look.lamp];
    if (lampLit(look.blink * live, inStatus)) {
      parts.lamp.color.set(colour.color);
      parts.lamp.emissive.set(colour.glow);
    } else {
      parts.lamp.color.set(LAMP_OFF);
      parts.lamp.emissive.set("#000000");
    }

    parts.fuse.visible = look.fuse;
    parts.fuse.scale.set(Math.min(1, Math.max(0.02, inStatus / this.fuseSeconds)), 1, 1);

    parts.tray.begin();
    rig.tray.slice(0, service.held).forEach((slot, slotIndex) => {
      parts.tray.place(slot, ((slotIndex * 7) % 5) * 0.12 - 0.24, 0, false, 0.92);
    });
    parts.tray.end();

    this.smoke(parts.puffs, look.smoke && animate ? inStatus : Number.NEGATIVE_INFINITY, rig.chimney);
  }

  /** Puffs smoke from `chimney` for a machine `seconds` down; hides it when not. */
  private smoke(puffs: readonly Group[], seconds: number, chimney: Point3): void {
    const placed = puffsAt(seconds, puffs.length);
    puffs.forEach((group, index) => {
      const puff = placed[index];
      group.visible = puff !== undefined;
      if (puff !== undefined) {
        group.position.set(chimney.x + puff.drift, chimney.y + puff.rise, chimney.z);
        group.scale.setScalar(puff.size);
      }
    });
  }
}
