import type { CSSProperties, ReactNode, Ref } from "react";
import type { Pose } from "./DevicePose";

type DeviceFrameProps = Readonly<{
  /** Receives the element that carries the pose, as `--rx`, `--ry` and `--glare`. */
  bind: Ref<HTMLDivElement>;
  /** The pose to draw before the tilt takes over (and on the server). */
  rest: Pose;
  /** The screen. */
  children: ReactNode;
}>;

/**
 * The laptop's display seen from the front, a little left and above: a soft shadow on the page, the lid's
 * aluminium edge (with a sliver of its side showing), a thin space-grey rim with a lit top edge, the black
 * glass bezel with its rounded corner, the screen inside it, and a faint glare across the glass that slides
 * against the turn. It is much bigger than the panel; the panel's box crops it.
 */
export function DeviceFrame({ bind, rest, children }: DeviceFrameProps): ReactNode {
  const pose = { "--rx": `${rest.rotateX}deg`, "--ry": `${rest.rotateY}deg`, "--glare": String(rest.glare) } as CSSProperties;
  return (
    <div
      ref={bind}
      style={pose}
      className="absolute left-[44px] top-[46px] h-[760px] w-[760px] origin-top-left [transform:rotateX(var(--rx))_rotateY(var(--ry))]"
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-[30px] shadow-[0_1px_2px_rgb(30_20_10/0.22),14px_26px_40px_-16px_rgb(70_35_10/0.34),34px_64px_90px_-34px_rgb(70_35_10/0.3)]"
      />
      <div aria-hidden className="absolute inset-0 -translate-x-[2.5px] -translate-y-[2px] rounded-[30px] bg-[linear-gradient(180deg,#b9bbbf_0%,#7d8085_40%,#4d4f53_100%)]" />
      <div
        aria-hidden
        className="absolute inset-0 rounded-[30px] bg-[linear-gradient(160deg,#d4d6d9_0%,#9a9da2_16%,#74777c_42%,#5e6166_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),inset_1px_0_0_rgb(255_255_255/0.3),inset_0_0_0_0.5px_rgb(0_0_0/0.3)]"
      />
      <div className="absolute inset-[3.5px] rounded-[26.5px] bg-[radial-gradient(120%_80%_at_0%_0%,#1a1a1c_0%,#0a0a0b_45%,#050506_100%)] shadow-[inset_0_0_0_0.75px_rgb(255_255_255/0.07),inset_0_1px_1px_rgb(255_255_255/0.08)]">
        {children}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-[3.5px] overflow-hidden rounded-[26.5px]">
        <div className="absolute -inset-x-[30%] inset-y-0 bg-[linear-gradient(112deg,rgb(255_255_255/0.16)_0%,rgb(255_255_255/0.07)_18%,rgb(255_255_255/0)_34%)] [transform:translateX(calc(var(--glare)*48px))]" />
      </div>
    </div>
  );
}
