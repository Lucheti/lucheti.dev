"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cx } from "@/ui";
import { menuInsets, type Corner } from "./corner";
import { MENU_BAR_GLASS, type Desktop } from "./Desktop";
import { AppleGlyph, BatteryGlyph, ControlsGlyph, WifiGlyph } from "./glyphs";
import type { ClockFace, MenuClock } from "./MenuClock";

/** The clock reads the time only in the browser, so the server and the first paint agree on an empty face. */
function useClockFace(clock: MenuClock): ClockFace | null {
  const [face, setFace] = useState<ClockFace | null>(null);
  useEffect(() => {
    const read = (): void => setFace(clock.read(new Date()));
    read();
    const handle = window.setInterval(read, 1000);
    return () => window.clearInterval(handle);
  }, [clock]);
  return face;
}

type MenuBarProps = Readonly<{ corner: Corner; desktop: Desktop; app: string; menus: readonly string[]; clock: MenuClock }>;

/**
 * The macOS menu bar across the top of the screen: translucent over the wallpaper, the apple glyph, the
 * app's name in bold and its menus on the left, the status icons and the clock on the right. The clock's
 * separator flashes each second. The side away from the corner runs on past the crop. Decorative: the
 * app's own controls are in its window.
 */
export function MenuBar({ corner, desktop, app, menus, clock }: MenuBarProps): ReactNode {
  const face = useClockFace(clock);
  const insets = menuInsets(corner);
  return (
    <div
      aria-hidden
      className={cx(
        "absolute inset-x-0 top-0 z-10 flex h-[30px] items-center justify-between text-[13.5px] leading-none tracking-[-0.005em] text-[#1d1612] backdrop-blur-[28px] backdrop-saturate-[1.6]",
        MENU_BAR_GLASS[desktop],
      )}
      style={{ paddingLeft: insets.left, paddingRight: insets.right }}
    >
      <div className="flex items-center">
        <AppleGlyph className="mr-[19px] size-[15px] -translate-y-px" />
        <span className="mr-[19px] font-bold">{app}</span>
        {menus.map((menu) => (
          <span key={menu} className="mr-[19px] font-medium">
            {menu}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-[15px] font-medium">
        <BatteryGlyph className="h-[12.5px] w-[26px]" />
        <WifiGlyph className="h-[12px] w-[16px]" />
        <ControlsGlyph className="h-[13px] w-[15px]" />
        <span className="flex items-center gap-[6px] whitespace-nowrap tabular-nums">
          {face === null ? null : (
            <>
              <span>{face.date}</span>
              <span>
                {face.hours}
                <span className="motion-safe:animate-[clock-flash_1s_steps(1,end)_infinite]">:</span>
                {face.minutes} {face.period}
              </span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
