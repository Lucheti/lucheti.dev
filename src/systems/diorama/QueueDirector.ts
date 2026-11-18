import type { ButtonPoser } from "./ButtonPoser";
import type { QueueDioramaParts } from "./composeQueueDiorama";
import { MAX_STEP, type FrameInput, type FrameResult, type IslandRig } from "./kit";
import type { MachinePoser } from "./MachinePoser";
import type { ParcelPoser } from "./ParcelPoser";
import type { PinKey } from "./QueueLayout";

/**
 * Runs the queue diorama's frames: the rig turns and frames the island, then the posers take the frame:
 * the button and kiosk, the machines (from the simulation's latest view), and the parcels (the queue's
 * pile and the flights in the air). Last, the labels are pinned where their points landed.
 */
export class QueueDirector {
  public constructor(
    private readonly parts: QueueDioramaParts,
    private readonly rig: IslandRig<PinKey>,
    private readonly button: ButtonPoser,
    private readonly machines: MachinePoser,
    private readonly parcels: ParcelPoser,
  ) {}

  /** Whether the pointer is over the big button. */
  public hover(over: boolean): void {
    this.button.hover(over);
  }

  /** Poses everything for this frame. */
  public frame(input: FrameInput): FrameResult {
    const { behaviour } = input;
    const { first, step, turning } = this.rig.frame(input);
    const { toy, relay, clock } = this.parts;
    const view = toy.loop.view();
    const pressing = this.button.pose(step, behaviour.animate);
    this.machines.pose(view.services, clock.now(), step, behaviour.animate);
    this.parcels.pose(view.queued, relay.flights(), behaviour.animate ? step : MAX_STEP * 100);
    this.rig.pinLabels(input);

    const busy = pressing || turning || this.parcels.settling();
    return { first, busy };
  }
}
