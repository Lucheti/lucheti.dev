import type { BigButton } from "./BigButton";
import type { ButtonPress } from "./ButtonPress";
import { squash, type Approach, type Point3 } from "./kit";
import type { QueueModel } from "./QueueModel";

/** How far the cap rises when the pointer is over it, in island units. */
const HOVER_RISE = 0.06;
/** How hard the kiosk pulses when the button sends. */
const KIOSK_PULSE = 0.07;

/**
 * Poses the big button and the kiosk behind it: the cap rises a little under the pointer, plunges and
 * squashes when pressed and springs back up past its rest; the kiosk gives a small squash-and-stretch pulse
 * as the batch goes out.
 */
export class ButtonPoser {
  private hovered = false;

  public constructor(
    private readonly model: QueueModel,
    private readonly button: BigButton,
    private readonly press: ButtonPress,
    /** Where the cap's foot rests, and how far down it goes when pressed. */
    private readonly rest: Readonly<{ cap: Point3; travel: number }>,
    private readonly lift: Approach,
  ) {}

  /** Whether the pointer is over the button. */
  public hover(over: boolean): void {
    this.hovered = over;
  }

  /** Poses the cap and the kiosk for this frame. Returns whether either is still moving. */
  public pose(seconds: number, animate: boolean): boolean {
    const wanted = this.hovered ? 1 : 0;
    const lifted = animate ? this.lift.toward(wanted, seconds) : this.lift.snap(wanted);
    const age = animate ? this.button.age() : Number.POSITIVE_INFINITY;
    const pose = this.press.at(age);
    const cap = this.model.cap();
    cap.position.set(this.rest.cap.x, this.rest.cap.y + lifted * HOVER_RISE - pose.depth * this.rest.travel, this.rest.cap.z);
    cap.scale.set(pose.wide, pose.tall, pose.wide);

    const pulse = squash(age, KIOSK_PULSE);
    this.model.kiosk().scale.set(pulse.wide, pulse.tall, pulse.wide);
    return !this.lift.at(wanted) || !this.press.settled(age);
  }
}
