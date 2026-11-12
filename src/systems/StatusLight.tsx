import type { ReactNode } from "react";
import { cx } from "@/ui";
import type { ServiceStatus } from "./SagaSequencer";

function assertNever(value: never): never {
  throw new Error(`Unhandled status: ${String(value)}`);
}

const COLOR: Readonly<Record<ServiceStatus, string>> = {
  idle: "text-mute",
  running: "text-ink motion-safe:animate-pulse",
  done: "text-ink",
  failed: "text-signal",
  compensating: "text-signal motion-safe:animate-pulse",
  compensated: "text-signal",
};

function glyph(status: ServiceStatus): ReactNode {
  switch (status) {
    case "idle":
      return <circle cx="10" cy="10" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.25" />;
    case "running":
    case "compensating":
      return <circle cx="10" cy="10" r="5.5" fill="currentColor" />;
    case "done":
      return (
        <>
          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.25" />
          <path d="M6.5 10.2 9 12.7 13.7 7.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </>
      );
    case "failed":
      return <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" fill="none" stroke="currentColor" strokeWidth="1.75" />;
    case "compensated":
      return (
        <>
          <path d="M5.2 8.2A5.6 5.6 0 1 1 5 11.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.2 4.2 5.2 8.2 9.2 7.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </>
      );
    default:
      return assertNever(status);
  }
}

/** The small status mark on a service: hollow, pulsing dot, check, cross or undo arrow. */
export function StatusLight({ status }: { readonly status: ServiceStatus }): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cx("size-5 shrink-0 transition-colors duration-300", COLOR[status])}>
      {glyph(status)}
    </svg>
  );
}
