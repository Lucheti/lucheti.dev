import type { ReactNode } from "react";
import type { OfficePanel } from "@/content";
import { cx } from "@/ui";
import type { StationId } from "../office";
import type { LabelPins } from "./kit";
import type { PinKey } from "./OfficeLayout";
import { OFFICE_PAINTS, TONE } from "./palette";

/** A label pinned to a point on the island; hidden until the scene first moves it into place. */
function Pin({ pins, at, className, children }: Readonly<{ pins: LabelPins<PinKey>; at: PinKey; className?: string; children: ReactNode }>): ReactNode {
  return (
    <div ref={pins.bind(at)} className="invisible absolute left-0 top-0 will-change-transform">
      <div className={cx("select-none whitespace-nowrap", className)}>{children}</div>
    </div>
  );
}

/** A label pill: small while the island is narrow (sized by the island's box, not the screen), full size from 36rem across. */
const PILL =
  "rounded-full px-[5px] py-px text-[9px] font-semibold leading-[14px] shadow-[0_2px_0_#2e2340] ring-[1.5px] ring-[#2e2340] @[36rem]:px-2 @[36rem]:py-0.5 @[36rem]:text-[11px] @[36rem]:leading-4";

/** Each department's colour, as on its robot's belly and its desk's front. */
const ACCENT: Readonly<Record<StationId, string>> = {
  product: OFFICE_PAINTS[TONE.sunny].color,
  design: OFFICE_PAINTS[TONE.pink].color,
  engineering: OFFICE_PAINTS[TONE.blue].color,
  qa: OFFICE_PAINTS[TONE.mint].color,
  release: OFFICE_PAINTS[TONE.signal].color,
};

const STATIONS: readonly StationId[] = ["product", "design", "engineering", "qa", "release"];

type LabelsProps = Readonly<{ pins: LabelPins<PinKey>; office: OfficePanel; overflow: number }>;

/**
 * The island's labels as crisp HTML in a layer over the canvas: each department's sign with its colour,
 * the call over the big button, and "+N" over a full inbox. The scene moves them; React only changes what
 * they say. They are decoration: the strip under the island reads the office out.
 */
export function OfficeLabels({ pins, office, overflow }: LabelsProps): ReactNode {
  return (
    <div aria-hidden className="@container pointer-events-none absolute inset-0 overflow-hidden">
      {STATIONS.map((station) => (
        <Pin key={station} pins={pins} at={station} className={cx(PILL, "flex items-center gap-1 bg-[#fff6e6] text-[#2e2340]")}>
          <span className="size-1.5 rounded-full ring-1 ring-[#2e2340] @[36rem]:size-2" style={{ backgroundColor: ACCENT[station] }} />
          {office.departments[station]}
        </Pin>
      ))}
      <Pin pins={pins} at="button" className="flex flex-col items-center motion-safe:animate-[queue-bob_2.4s_ease-in-out_infinite]">
        <span className={cx(PILL, "bg-signal text-[10px] text-[#2e2340] @[36rem]:px-2.5 @[36rem]:text-[12px]")}>{office.drop.short}</span>
        <svg viewBox="0 0 10 6" className="mt-0.5 h-1.5 w-2.5 text-[#2e2340]">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Pin>
      <Pin pins={pins} at="overflow" className={cx(PILL, "bg-[#fff6e6] text-signal-ink transition-opacity", overflow > 0 ? "opacity-100" : "opacity-0")}>
        +{overflow}
      </Pin>
    </div>
  );
}
