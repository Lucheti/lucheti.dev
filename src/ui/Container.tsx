import type { ReactNode } from "react";
import { cx } from "./cx";

type BoxProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

/** The page gutter: centred, capped at 1400px. */
export function Container({ children, className }: BoxProps): ReactNode {
  return <div className={cx("mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16", className)}>{children}</div>;
}

/** Keeps content left of the 3D object from lg up; full width below. */
export function LeftColumn({ children, className }: BoxProps): ReactNode {
  return <div className={cx("lg:w-[56%]", className)}>{children}</div>;
}
