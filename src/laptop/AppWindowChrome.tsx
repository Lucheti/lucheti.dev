import type { ReactNode } from "react";
import { cx } from "@/ui";
import { windowPlace, type Corner } from "./corner";

/** The three window buttons, in their macOS colours. Decorative: this window cannot be closed. */
function TrafficLights(): ReactNode {
  const light = "size-[12px] rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.18)]";
  return (
    <div aria-hidden className="absolute left-[16px] top-[17px] z-10 flex gap-[8px]">
      <span className={`${light} bg-[#ff5f57]`} />
      <span className={`${light} bg-[#febc2e]`} />
      <span className={`${light} bg-[#28c840]`} />
    </div>
  );
}

type AppWindowChromeProps = Readonly<{
  corner: Corner;
  /** The window's size in the screen's pixels; it is bigger than what the crop shows. */
  size: Readonly<{ width: number; height: number }>;
  children: ReactNode;
}>;

/**
 * An app's window on the laptop's desktop, its corner in view and the rest running off the crop: rounded
 * corners, a hairline edge, a deep soft shadow on the wallpaper, the traffic lights at its top left and a
 * lit top edge.
 */
export function AppWindowChrome({ corner, size, children }: AppWindowChromeProps): ReactNode {
  return (
    <div
      className={cx(
        "absolute overflow-hidden rounded-[12px] bg-white shadow-[0_0_0_0.5px_rgb(20_20_30/0.16),0_24px_50px_-14px_rgb(20_20_40/0.28),0_6px_16px_-6px_rgb(20_20_40/0.12)]",
        windowPlace(corner),
      )}
      style={size}
    >
      <TrafficLights />
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] shadow-[inset_0_0.5px_0_rgb(255_255_255/0.7)]" />
    </div>
  );
}

/** The window's sidebar shell, translucent over the desktop the way macOS sidebars are, 200 px wide. */
export function SidebarShell({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <div className="absolute inset-y-0 left-0 flex w-[200px] flex-col bg-[rgb(244_244_242/0.85)] px-[10px] pt-[50px] shadow-[inset_-0.5px_0_0_rgb(60_30_15/0.12)] backdrop-blur-[40px] backdrop-saturate-[1.8]">
      {children}
    </div>
  );
}

/** The main area's toolbar, 50 px tall over a hairline. */
export function Toolbar({ children, className }: Readonly<{ children: ReactNode; className?: string }>): ReactNode {
  return <div className={cx("flex h-[50px] shrink-0 items-center gap-[6px] px-[18px] shadow-[inset_0_-0.5px_0_rgb(60_30_15/0.1)]", className)}>{children}</div>;
}
