import type { ReactNode } from "react";

/**
 * The laptop's display seen straight on: a soft shadow on the page, a thin space-grey rim with a lit top edge,
 * the black glass bezel with its rounded corner, the screen inside it, and a faint glare across the glass.
 * It is much bigger than the panel; the panel's box crops it.
 */
export function DeviceFrame({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <div className="absolute left-[44px] top-[46px] h-[760px] w-[760px]">
      <div
        aria-hidden
        className="absolute inset-0 rounded-[30px] shadow-[0_1px_2px_rgb(30_20_10/0.22),0_24px_40px_-16px_rgb(70_35_10/0.3),0_60px_90px_-34px_rgb(70_35_10/0.26)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 rounded-[30px] bg-[linear-gradient(160deg,#d4d6d9_0%,#9a9da2_16%,#74777c_42%,#5e6166_100%)] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),inset_1px_0_0_rgb(255_255_255/0.3),inset_0_0_0_0.5px_rgb(0_0_0/0.3)]"
      />
      <div className="absolute inset-[3.5px] rounded-[26.5px] bg-[radial-gradient(120%_80%_at_0%_0%,#1a1a1c_0%,#0a0a0b_45%,#050506_100%)] shadow-[inset_0_0_0_0.75px_rgb(255_255_255/0.07),inset_0_1px_1px_rgb(255_255_255/0.08)]">
        {children}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-[3.5px] overflow-hidden rounded-[26.5px]">
        <div className="absolute -inset-x-[30%] inset-y-0 bg-[linear-gradient(112deg,rgb(255_255_255/0.16)_0%,rgb(255_255_255/0.07)_18%,rgb(255_255_255/0)_34%)]" />
      </div>
    </div>
  );
}
