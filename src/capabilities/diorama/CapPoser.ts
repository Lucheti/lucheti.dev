import type { Group } from "three";
import type { Approach, BigButton, ButtonPress, Point3 } from "./kit";

/** How far the cap rises when the pointer is over it, in island units. */
const HOVER_RISE = 0.06;

/**
 * Poses the big button's cap: it rises a little under the pointer, plunges and squashes when pressed, and
 * springs back up past its rest.
 */
export class CapPoser {
  private hovered = false;

  public constructor(
    private readonly cap: Group,
    private readonly button: BigButton,
    private readonly press: ButtonPress,
    /** Where the cap's foot rests, and how far down it goes when pressed. */
    private readonly rest: Readonly<{ foot: Point3; travel: number }>,
    private readonly lift: Approach,
  ) {}

  /** Whether the pointer is over the button. */
  public hover(over: boolean): void {
    this.hovered = over;
  }

  /** Poses the cap for this frame. Returns whether it is still moving. */
  public pose(seconds: number, animate: boolean): boolean {
    const wanted = this.hovered ? 1 : 0;
    const lifted = animate ? this.lift.toward(wanted, seconds) : this.lift.snap(wanted);
    const age = animate ? this.button.age() : Number.POSITIVE_INFINITY;
    const pose = this.press.at(age);
    const { foot, travel } = this.rest;
    this.cap.position.set(foot.x, foot.y + lifted * HOVER_RISE - pose.depth * travel, foot.z);
    this.cap.scale.set(pose.wide, pose.tall, pose.wide);
    return !this.lift.at(wanted) || !this.press.settled(age);
  }
}
