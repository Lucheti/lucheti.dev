import type { ReactNode } from "react";
import type { BackdropManifest } from "@/content";

type BackdropProps = Readonly<{
  manifest: BackdropManifest;
}>;

/** Placeholder until work package A lands. */
export function Backdrop({ manifest }: BackdropProps): ReactNode {
  void manifest;
  return null;
}
