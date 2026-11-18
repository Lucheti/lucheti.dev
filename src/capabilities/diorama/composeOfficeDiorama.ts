import type { AgentTicket, OfficePanel } from "@/content";
import { composeOffice, ROCKET_CLIMB, type OfficeToy } from "../office";
import {
  BigButton,
  BrowserSeconds,
  ButtonPress,
  DioramaFraming,
  DragGesture,
  HoverTilt,
  IsometricView,
  LabelPins,
  point,
  PointerCursor,
  TurnSpring,
  Waker,
  type LeanReach,
  type Seconds,
} from "./kit";
import { DropIdea } from "./DropIdea";
import { OfficeLayout, type PinKey } from "./OfficeLayout";
import { TicketPath } from "./TicketPath";

/** Everything the office diorama runs on that needs no WebGL, made once. */
export type OfficeDioramaParts = Readonly<{
  toy: OfficeToy;
  layout: OfficeLayout;
  path: TicketPath;
  button: BigButton;
  press: ButtonPress;
  clock: Seconds;
  waker: Waker;
  turn: TurnSpring;
  lean: HoverTilt;
  leanReach: LeanReach;
  gesture: DragGesture;
  cursor: PointerCursor;
  view: IsometricView;
  framing: DioramaFraming;
  /** The HTML labels pinned to the island. */
  pins: LabelPins<PinKey>;
}>;

const DEGREE = Math.PI / 180;
/** The camera's fixed three-quarter angle: turned 34° round from the front, looking 30° down, as on the queue. */
const CAMERA_YAW = 34 * DEGREE;
const CAMERA_PITCH = 30 * DEGREE;
/** How far the island turns under a drag, at most. */
const DRAG_REACH = 30 * DEGREE;
/** How far past the plinth the island's soft shadow reaches. */
export const SHADOW_SPILL = 0.5;

/**
 * The composition root of the office diorama: the office (the same floor the strip and the announcements
 * read), and every part of the 3D scene that needs no WebGL, built once from the tuning here.
 */
export function composeOfficeDiorama(office: OfficePanel, tickets: readonly AgentTicket[]): OfficeDioramaParts {
  const toy = composeOffice(
    tickets.map(({ id, title }) => ({ id, title })),
    office.announcements,
  );
  const layout = new OfficeLayout();
  const clock = new BrowserSeconds();
  const waker = new Waker();
  const view = new IsometricView(CAMERA_YAW, CAMERA_PITCH);
  const leanReach: LeanReach = { yaw: 4 * DEGREE, tilt: 3 * DEGREE };
  // The shadow's blur has faded out well before the edge of its plane: frame only what shows of it.
  const half = layout.half();
  const spill = SHADOW_SPILL * 0.4;
  const bottom = layout.bottom();
  const shadowCorners = [-1, 1].flatMap((x) => [-1, 1].map((z) => point(x * (half.x + spill), bottom, z * (half.z + spill))));
  const framed = [...layout.silhouette(ROCKET_CLIMB), ...shadowCorners];
  return {
    toy,
    layout,
    path: new TicketPath(layout.spots(), { hop: 0.6, deskHop: 0.35, bounceHop: 0.95, share: 0.6, facing: CAMERA_YAW }),
    button: new BigButton(new DropIdea(toy.office), clock, waker),
    press: new ButtonPress({ push: 0.07, hold: 0.07, frequency: 2.6, decay: 6.5, squash: 0.38 }),
    clock,
    waker,
    turn: new TurnSpring({ reach: DRAG_REACH, perPixel: 0.006, stiffness: 55, damping: 10 }),
    lean: new HoverTilt(3.5),
    leanReach,
    gesture: new DragGesture(5),
    cursor: new PointerCursor(),
    view,
    framing: new DioramaFraming(view, framed, { yaw: DRAG_REACH + leanReach.yaw, tilt: leanReach.tilt }, 0.015),
    pins: new LabelPins(layout.labels()),
  };
}
