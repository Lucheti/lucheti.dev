import { assertNever } from "./assertNever";

/**
 * Which corner of the laptop's display a panel shows. The device, its menu bar and the app window sit in
 * that corner, and everything runs off the crop on the other two sides.
 */
export type Corner = Readonly<{ kind: "top-left" }> | Readonly<{ kind: "top-right" }>;

/** The classes that place and light the device for one corner. */
export type DeviceSkin = Readonly<{
  /** Where the 760 px device sits on the 700 px stage: 44 px in from the corner's side, 46 px down. */
  place: string;
  /** The aluminium rim; its light falls from the corner. */
  rim: string;
  /** The black glass, a touch brighter at the corner. */
  bezel: string;
  /** The glare across the glass, swept from the corner. */
  glare: string;
}>;

const RIM =
  "absolute inset-0 rounded-[30px] bg-[linear-gradient(160deg,#d4d6d9_0%,#9a9da2_16%,#74777c_42%,#5e6166_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),inset_1px_0_0_rgb(255_255_255/0.3),inset_0_0_0_0.5px_rgb(0_0_0/0.3)]";
const GLARE =
  "absolute -inset-x-[30%] inset-y-0 bg-[linear-gradient(112deg,rgb(255_255_255/0.16)_0%,rgb(255_255_255/0.07)_18%,rgb(255_255_255/0)_34%)]";
const BEZEL_SHADOW = "shadow-[inset_0_0_0_0.75px_rgb(255_255_255/0.07),inset_0_1px_1px_rgb(255_255_255/0.08)]";

/** The device's look for a corner: the top-right one is the top-left one in a mirror. */
export function deviceSkin(corner: Corner): DeviceSkin {
  switch (corner.kind) {
    case "top-left":
      return {
        place: "left-[44px]",
        rim: RIM,
        bezel: `bg-[radial-gradient(120%_80%_at_0%_0%,#1a1a1c_0%,#0a0a0b_45%,#050506_100%)] ${BEZEL_SHADOW}`,
        glare: GLARE,
      };
    case "top-right":
      return {
        place: "left-[-104px]",
        rim: `${RIM} -scale-x-100`,
        bezel: `bg-[radial-gradient(120%_80%_at_100%_0%,#1a1a1c_0%,#0a0a0b_45%,#050506_100%)] ${BEZEL_SHADOW}`,
        glare: `${GLARE} -scale-x-100`,
      };
    default:
      return assertNever(corner);
  }
}

/**
 * The menu bar's side padding for a corner, in px. On the corner's side it is macOS's own; on the far side the
 * screen runs on past the crop, so the items there are drawn this far in, where the crop cuts.
 */
export function menuInsets(corner: Corner): Readonly<{ left: number; right: number }> {
  switch (corner.kind) {
    case "top-left":
      return { left: 18, right: 62 };
    case "top-right":
      return { left: 62, right: 18 };
    default:
      return assertNever(corner);
  }
}

/** Where the app window's corner sits on the screen: 28 px in from the corner's side, under the menu bar. */
export function windowPlace(corner: Corner): string {
  switch (corner.kind) {
    case "top-left":
      return "left-[28px] top-[58px]";
    case "top-right":
      return "right-[28px] top-[58px]";
    default:
      return assertNever(corner);
  }
}
