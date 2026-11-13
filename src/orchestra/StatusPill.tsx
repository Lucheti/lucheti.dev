import type { ReactNode } from "react";
import { cx } from "@/ui";
import type { DepartmentStatus } from "./LifecycleScript";

type Look = Readonly<{ word: string; className: string }>;

const IDLE: Look = { word: "idle", className: "border-line-dark text-fog-dim/70" };
const WORKING: Look = { word: "working", className: "border-signal/70 text-signal" };
const HANDING_OFF: Look = { word: "handing off", className: "border-fog/40 text-fog" };
const AUTOMATED: Look = { word: "automated", className: "border-dashed border-signal/70 text-signal" };

function lookOf(status: DepartmentStatus): Look {
  switch (status.kind) {
    case "idle":
      return IDLE;
    case "working":
      return WORKING;
    case "handing-off":
      return HANDING_OFF;
    case "automated":
      return AUTOMATED;
    default:
      return assertNever(status);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected status: ${JSON.stringify(value)}`);
}

/** The small squared status tag in a department's header. */
export function StatusPill({ status }: { readonly status: DepartmentStatus }): ReactNode {
  const look = lookOf(status);
  return (
    <span
      className={cx(
        "inline-flex h-4 shrink-0 items-center whitespace-nowrap rounded-[3px] border px-1 font-mono text-[9px] uppercase leading-none tracking-[0.1em] transition-colors duration-300",
        look.className,
      )}
    >
      {look.word}
    </span>
  );
}
