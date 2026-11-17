import type { ReactNode } from "react";
import type { QueuePanel } from "@/content";
import { cx } from "@/ui";
import { assertNever } from "../queue/assertNever";
import type { QueueSnapshot, ServiceView } from "../queue/types";
import type { LabelPins, PinKey } from "./LabelPins";
import { lookOf } from "./ServiceLook";

/** A label pinned to a point on the island; hidden until the scene first moves it into place. */
function Pin({ pins, at, className, children }: Readonly<{ pins: LabelPins; at: PinKey; className?: string; children: ReactNode }>): ReactNode {
  return (
    <div ref={pins.bind(at)} className="invisible absolute left-0 top-0 will-change-transform">
      <div className={cx("select-none whitespace-nowrap", className)}>{children}</div>
    </div>
  );
}

/** A small turning ring on a restarting machine's screen. */
function Spinner(): ReactNode {
  return <span className="block size-3.5 animate-spin rounded-full border-2 border-[#7ff0b0]/25 border-t-[#7ff0b0]" />;
}

/** What a machine's screen shows: how many it has done, a spinner while it restarts, or that it is down. */
function ScreenFace({ service, down }: Readonly<{ service: ServiceView; down: string }>): ReactNode {
  const screen = lookOf(service.status.kind).screen;
  switch (screen) {
    case "count":
      return <span className="text-[13px] font-bold leading-none tabular-nums text-[#7ff0b0]">{service.processed}</span>;
    case "spinner":
      return <Spinner />;
    case "down":
      return <span className="text-[10px] font-bold uppercase leading-none tracking-[0.06em] text-[#ff7a4a]">{down}</span>;
    default:
      return assertNever(screen);
  }
}

type LabelsProps = Readonly<{ pins: LabelPins; panel: QueuePanel; snapshot: QueueSnapshot; overflow: number }>;

const PILL =
  "rounded-full px-[5px] py-px text-[9px] font-semibold leading-[14px] shadow-[0_2px_0_#2b2236] ring-[1.5px] ring-[#2b2236] sm:px-2 sm:py-0.5 sm:text-[11px] sm:leading-4";

/**
 * The island's labels as crisp HTML in a layer over the canvas: the kiosk's name, the call over the big
 * button, the broker's name and depth, "+N" over a full hopper, and each machine's sign and screen. The
 * scene moves them; React only changes what they say. They are decoration: the counts are read out in
 * the strip under the island.
 */
export function QueueLabels({ pins, panel, snapshot, overflow }: LabelsProps): ReactNode {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Pin pins={pins} at="kiosk" className={cx(PILL, "bg-[#fff4e0] text-[#2b2236]")}>
        {panel.producer.name}
      </Pin>
      <Pin pins={pins} at="button" className="flex flex-col items-center motion-safe:animate-[queue-bob_2.4s_ease-in-out_infinite]">
        <span className={cx(PILL, "bg-signal text-[11px] text-[#2b2236] sm:px-2.5 sm:text-[12px]")}>{panel.send.short}</span>
        <svg viewBox="0 0 10 6" className="mt-0.5 h-1.5 w-2.5 text-[#2b2236]">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Pin>
      <Pin pins={pins} at="broker" className="flex items-baseline gap-1.5 rounded-md bg-[#2b2236] px-2 py-1 text-[#fff4e0]">
        <span className="text-[10px] font-semibold leading-none">{panel.broker.name}</span>
        <span className="text-[13px] font-bold leading-none tabular-nums">{snapshot.queued.length}</span>
      </Pin>
      <Pin pins={pins} at="overflow" className={cx(PILL, "bg-[#fff4e0] text-signal-ink transition-opacity", overflow > 0 ? "opacity-100" : "opacity-0")}>
        +{overflow}
      </Pin>
      {panel.services.map((service, index) => (
        <div key={service.name}>
          <Pin pins={pins} at={`sign-${index}`} className={cx(PILL, "bg-[#fff4e0] text-[#2b2236]")}>
            {service.name}
          </Pin>
          <Pin pins={pins} at={`screen-${index}`} className="grid h-4 min-w-6 place-items-center">
            <ScreenFace service={snapshot.services[index]} down={panel.statuses.down} />
          </Pin>
        </div>
      ))}
    </div>
  );
}
