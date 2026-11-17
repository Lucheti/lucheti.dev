import { assertNever } from "../layers/assertNever";
import type { DioramaState } from "./DioramaState";
import type { Reactions } from "./Reactions";
import type { Target } from "./Target";

/**
 * Asks the scene for frames when something changes while it only renders on demand. It starts as a no-op;
 * the canvas binds its own `invalidate` once it exists.
 */
export class Waker {
  private wakeUp: () => void = () => undefined;

  /** The function that asks for a frame. */
  public bind(wakeUp: () => void): void {
    this.wakeUp = wakeUp;
  }

  /** Forgets the canvas, once it is gone. */
  public unbind(): void {
    this.wakeUp = () => undefined;
  }

  /** Asks for a frame. */
  public wake(): void {
    this.wakeUp();
  }
}

/**
 * Where every click on the island lands, from the 3D pieces and from their keyboard twins alike: the
 * pegboard's controls change the screen, the lamp switches, and every piece clicked plays its reaction.
 */
export class Switchboard {
  public constructor(
    private readonly state: DioramaState,
    private readonly reactions: Reactions,
    private readonly waker: Waker,
  ) {}

  /** `target` was clicked. */
  public press(target: Target): void {
    switch (target.kind) {
      case "toggle":
        this.state.flipTheme();
        break;
      case "button":
        this.state.popToast();
        break;
      case "slider":
        this.state.stepDensity();
        break;
      case "star":
        this.state.rate(target.count);
        break;
      case "checkbox":
        this.state.toggleDone();
        break;
      case "lamp":
        this.state.switchLamp();
        break;
      case "duck":
      case "plant":
      case "card":
        break;
      default:
        assertNever(target);
    }
    this.reactions.kick(target.kind);
    this.waker.wake();
  }
}
