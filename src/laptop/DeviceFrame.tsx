import type { ReactNode } from "react";
import { cx } from "@/ui";
import { deviceSkin, type Corner } from "./corner";

/**
 * The laptop's display seen straight on: a soft shadow on the page, a thin space-grey rim with a lit top edge,
 * the black glass bezel with its rounded corner, the screen inside it, and a faint glare across the glass.
 * It is much bigger than the panel; the panel's box crops it, so only `corner` is seen whole.
 */
export function DeviceFrame({ corner, children }: Readonly<{ corner: Corner; children: ReactNode }>): ReactNode {
  const skin = deviceSkin(corner);
  return (
    <div className={cx("absolute top-[46px] h-[760px] w-[760px]", skin.place)}>
      <div
        aria-hidden
        className="absolute inset-0 rounded-[30px] shadow-[0_1px_2px_rgb(30_20_10/0.22),0_24px_40px_-16px_rgb(70_35_10/0.3),0_60px_90px_-34px_rgb(70_35_10/0.26)]"
      />
      <div aria-hidden className={skin.rim} />
      <div className={cx("absolute inset-[3.5px] rounded-[26.5px]", skin.bezel)}>{children}</div>
      <div aria-hidden className="pointer-events-none absolute inset-[3.5px] overflow-hidden rounded-[26.5px]">
        <div className={skin.glare} />
      </div>
    </div>
  );
}
