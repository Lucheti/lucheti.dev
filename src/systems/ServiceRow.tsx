import { memo, type CSSProperties, type ReactNode } from "react";
import type { QueuePanel } from "@/content";
import { cx, ToolSwatch } from "@/ui";
import type { ElementRef } from "./queue/FlightPainter";
import { assertNever } from "./queue/assertNever";
import type { ServiceStatus } from "./queue/types";

type Kind = ServiceStatus["kind"];

/** How a row and its badge look in one status. */
type StatusSkin = Readonly<{ row: string; badge: string }>;

function statusSkin(kind: Kind): StatusSkin {
  switch (kind) {
    case "healthy":
      return { row: "bg-white ring-1 ring-line", badge: "text-mute" };
    case "busy":
      return { row: "bg-white ring-1 ring-signal/60", badge: "bg-signal-soft text-signal-ink" };
    case "down":
      return {
        row: "bg-white ring-2 ring-ink motion-safe:animate-[toy-shake_420ms_ease-in-out]",
        badge: "bg-signal font-semibold text-ink",
      };
    case "restarting":
      return { row: "bg-paper-raised ring-1 ring-line", badge: "text-ink-soft" };
    default:
      return assertNever(kind);
  }
}

/** A small turning ring; it rests still under reduced motion. */
function Spinner(): ReactNode {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-full border-[1.5px] border-ink/20 border-t-ink motion-safe:animate-spin"
    />
  );
}

type PipsProps = Readonly<{
  held: number;
  incoming: number;
  limit: number;
  capacity: number;
  anchor: ElementRef;
}>;

/**
 * The service's slots: solid for messages it holds, a ring for ones on their way. The slots past the
 * limit, after a hairline, are the ones that make it busy.
 */
function Pips({ held, incoming, limit, capacity, anchor }: PipsProps): ReactNode {
  return (
    <span ref={anchor} aria-hidden className="flex shrink-0 items-center gap-[3px]">
      {Array.from({ length: capacity }, (_, slot) => (
        <span key={slot} className="flex items-center gap-[3px]">
          {slot === limit ? <span className="mx-px h-2.5 w-px bg-ink/25" /> : null}
          <span
            className={cx(
              "size-[7px] rounded-full transition-colors duration-200 motion-reduce:transition-none",
              pipFill(slot, held, incoming, limit),
            )}
          />
        </span>
      ))}
    </span>
  );
}

/** A slot's look: held, on its way, an empty comfortable slot, or an empty slot past the limit. */
function pipFill(slot: number, held: number, incoming: number, limit: number): string {
  if (slot < held) {
    return "bg-signal";
  }
  if (slot < held + incoming) {
    return "ring-[1.5px] ring-inset ring-signal";
  }
  return slot < limit ? "bg-ink/10" : "ring-1 ring-inset ring-ink/20";
}

type ServiceRowProps = Readonly<{
  name: string;
  tool: string;
  kind: Kind;
  /** When the status began; a new busy spell restarts the fuse. */
  since: number;
  held: number;
  incoming: number;
  processed: number;
  limit: number;
  capacity: number;
  overloadMs: number;
  statuses: QueuePanel["statuses"];
  readout: QueuePanel["readout"];
  anchor: ElementRef;
}>;

/**
 * One consumer service: its swatch and name, how many it has done, its slots and its status. A busy
 * service shows a fuse burning along its foot; a service that goes down shakes once.
 */
export const ServiceRow = memo(function ServiceRow(props: ServiceRowProps): ReactNode {
  const { name, tool, kind, since, held, incoming, processed, limit, capacity, overloadMs, statuses, readout, anchor } =
    props;
  const skin = statusSkin(kind);
  const fuse: CSSProperties = { animationDuration: `${overloadMs}ms` };

  return (
    <li
      className={cx(
        "relative flex min-w-0 items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2 transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none",
        skin.row,
      )}
    >
      <ToolSwatch tool={tool} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="flex min-w-0 items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold leading-5">{name}</span>
          <span className="shrink-0 text-[11px] tabular-nums text-mute">
            {processed} {readout.done}
          </span>
        </p>
        <div className="flex items-center justify-between gap-2">
          <Pips held={held} incoming={incoming} limit={limit} capacity={capacity} anchor={anchor} />
          <span className="sr-only">
            {held + incoming} {readout.inFlight}
          </span>
          <span
            className={cx(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[11px] leading-4",
              skin.badge,
            )}
          >
            {kind === "restarting" ? <Spinner /> : null}
            {statuses[kind]}
          </span>
        </div>
      </div>
      {kind === "busy" ? (
        <span
          key={since}
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-signal motion-safe:animate-[toy-fuse_linear_forwards]"
          style={fuse}
        />
      ) : null}
    </li>
  );
});
