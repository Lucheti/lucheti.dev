import { assertNever } from "../office/assertNever";
import type { StationId, StationLook } from "../office";
import type { OfficeModel } from "./OfficeModel";
import type { RobotRig } from "./OfficeLayout";
import { robotPose, type Hands } from "./RobotMotion";

/** What a station's robot does with its hands for how the station looks. */
function handsAt(station: StationId, look: StationLook): Hands {
  switch (station) {
    case "product":
      return { kind: "hold", drop: Math.max(0, look.stamp) };
    case "design":
      return look.mood === "work" ? { kind: "paint" } : { kind: "rest" };
    case "engineering":
      return look.typing ? { kind: "type" } : { kind: "rest" };
    case "qa":
      return look.mood === "cheer" ? { kind: "cheer" } : { kind: "hold", drop: 0.2 };
    case "release":
      return look.mood === "cheer" ? { kind: "cheer" } : { kind: "rest" };
    default:
      return assertNever(station);
  }
}

/**
 * Poses the seven robots from how their stations look: each breathes, blinks and looks round while idle,
 * tips its head down at work with its hands busy (holding the stamp, drawing, typing, holding the
 * magnifier), hops and waves when its station has done something good, and shakes its head at a bug.
 */
export class RobotPoser {
  public constructor(
    private readonly model: OfficeModel,
    private readonly rigs: readonly RobotRig[],
  ) {}

  /** Poses every robot at `now` (seconds) for the stations' looks; still robots stand at their rest pose. */
  public pose(looks: Readonly<Record<StationId, StationLook>>, now: number, animate: boolean): void {
    const time = animate ? now : 0;
    this.rigs.forEach((rig, index) => {
      const look = looks[rig.station];
      const pose = robotPose(time, index + 1, look.mood, handsAt(rig.station, look));
      const parts = this.model.robot(index);
      parts.root.position.y = rig.at.y + pose.lift;
      parts.head.rotation.set(pose.headPitch, pose.headYaw, 0);
      parts.eyes.scale.set(1, pose.eyes, 1);
      parts.arms[0].rotation.x = pose.arms[0];
      parts.arms[1].rotation.x = pose.arms[1];
    });
  }
}
