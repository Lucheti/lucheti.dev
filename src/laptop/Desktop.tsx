import type { ReactNode } from "react";
import { assertNever } from "./assertNever";
import type { Corner } from "./corner";
import { Wallpaper } from "./Wallpaper";

/** What the screen shows behind the app: the warm orange wallpaper, or a plain white desktop. */
export type Desktop = "warm" | "white";

/** The menu bar's glass for each desktop: tinted warm over the wallpaper, neutral over white. */
export const MENU_BAR_GLASS: Readonly<Record<Desktop, string>> = {
  warm: "bg-[rgb(255_236_222/0.42)] shadow-[inset_0_-0.5px_0_rgb(80_30_10/0.12)]",
  white: "bg-[rgb(255_255_255/0.7)] shadow-[inset_0_-0.5px_0_rgb(20_20_20/0.1)]",
};

/** The picture behind the app window. */
export function DesktopPicture({ desktop, corner }: Readonly<{ desktop: Desktop; corner: Corner }>): ReactNode {
  switch (desktop) {
    case "warm":
      return <Wallpaper corner={corner} />;
    case "white":
      return <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#fdfdfc_0%,#f1f1ef_100%)]" />;
    default:
      return assertNever(desktop);
  }
}
