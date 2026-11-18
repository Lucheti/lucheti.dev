"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { ServiceMapCopy } from "@/content";
import { AppWindowChrome, ChevronDownGlyph, ChevronRightGlyph, SearchGlyph, SidebarShell, TAG_PILL, Toolbar, type Corner } from "@/laptop";
import { cx } from "@/ui";
import type { ServiceMapParts } from "./composeServiceMap";
import { BoltGlyph, ClockGlyph } from "./glyphs";
import { MapCanvas } from "./MapCanvas";
import type { MapSnapshot } from "./types";

const CORNER: Corner = { kind: "top-right" };
/** Narrower than the task tracker's, so its sidebar's edge peeks in at the crop. */
const SIZE = { width: 760, height: 900 } as const;

/**
 * The sidebar, mostly off the crop to the left: only its right edge shows, with the selected page's highlight
 * and the live count of incidents. Decorative; the map's own controls are on the canvas and the toolbar.
 */
function OpsSidebar({ copy, map }: Readonly<{ copy: ServiceMapCopy; map: MapSnapshot }>): ReactNode {
  return (
    <SidebarShell>
      <div aria-hidden className="flex flex-col">
        <div className="flex items-center justify-between pl-[4px]">
          <div className="flex min-w-0 items-center gap-[8px] py-[4px] pl-[3px] pr-[6px]">
            <span className="flex size-[20px] shrink-0 items-center justify-center rounded-[6px] bg-[linear-gradient(145deg,#ff8a4c,#ff5a1f_55%,#e2430f)] text-[11px] font-semibold text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.4),0_0.5px_1px_rgb(120_40_10/0.4)]">
              {copy.environment.slice(0, 1)}
            </span>
            <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-[#1d1612]">{copy.environment}</span>
            <ChevronDownGlyph className="size-[13px] shrink-0 text-[#857a73]" />
          </div>
          <span className="flex size-[26px] items-center justify-center rounded-[7px] text-[#5d524c]">
            <BoltGlyph className="size-[15px]" />
          </span>
        </div>
        <span className="mt-[10px] flex h-[28px] items-center gap-[8px] rounded-[7px] bg-[rgb(60_30_15/0.05)] px-[9px] text-[13px] text-[#7a6f69] shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.08)]">
          <SearchGlyph className="size-[15px] shrink-0" />
          <span className="flex-1">{copy.search}</span>
          <kbd className="font-sans text-[11.5px] tracking-[0.04em] text-[#9a8f88]">⌘K</kbd>
        </span>
        <ul className="mt-[14px] flex flex-col gap-[1px]">
          {copy.pages.map((page) => {
            const count = page.count === "incidents" ? map.incidents : null;
            return (
              <li
                key={page.name}
                className={cx(
                  "flex h-[28px] items-center gap-[9px] rounded-[7px] px-[9px] text-[13px] tracking-[-0.006em]",
                  page.selected ? "bg-[rgb(60_30_15/0.085)] font-medium text-[#1d1612]" : "text-[#3b3330]",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{page.name}</span>
                {count === null || count === 0 ? null : <span className="text-[12px] font-semibold tabular-nums text-[#c8302c]">{count}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </SidebarShell>
  );
}

type MapToolbarProps = Readonly<{ copy: ServiceMapCopy; map: MapSnapshot; live: boolean; reduced: boolean; onSpike: () => void }>;

/** The toolbar: the breadcrumb, then at its right end the live indicator, the time range and "Simulate spike". */
function MapToolbar({ copy, map, live, reduced, onSpike }: MapToolbarProps): ReactNode {
  return (
    <Toolbar className="pr-[14px]">
      <span className="text-[13.5px] font-medium text-[#8a7f78]">{copy.environment}</span>
      <ChevronRightGlyph className="size-[13px] text-[#b3aaa4]" />
      <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#1d1612]">{copy.title}</h3>
      <span className="ml-auto flex items-center gap-[10px]">
        <span className="flex items-center gap-[6px] text-[12px] font-medium text-[#6b615b]">
          <span aria-hidden className="relative flex size-[7px]">
            {live && !reduced ? <span className="absolute inset-0 animate-ping rounded-full bg-[#30a46c] opacity-50" /> : null}
            <span className={cx("relative size-[7px] rounded-full", live ? "bg-[#30a46c]" : "bg-[#b3aaa4]")} />
          </span>
          {live ? copy.live.on : copy.live.off}
        </span>
        <span aria-hidden className={cx(TAG_PILL, "flex h-[26px] items-center gap-[5px] px-[9px] text-[12px] font-medium text-[#4a403b]")}>
          <ClockGlyph className="size-[13px] text-[#857a73]" />
          {copy.range}
          <ChevronDownGlyph className="size-[12px] text-[#857a73]" />
        </span>
        <button
          type="button"
          data-ghost="spike"
          onClick={onSpike}
          aria-disabled={map.spiking}
          className={cx(
            "flex h-[28px] items-center gap-[6px] rounded-[7px] px-[10px] text-[12.5px] font-semibold tracking-[-0.004em] transition-[filter,transform,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none",
            map.spiking
              ? "cursor-default bg-[rgb(255_90_31/0.12)] text-[#c2410c]"
              : "bg-[linear-gradient(145deg,#ff8a4c,#ff5a1f_55%,#e2430f)] text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.4),0_0.5px_1px_rgb(120_40_10/0.4),0_2px_6px_-2px_rgb(200_60_10/0.45)] hover:brightness-105 data-[ghost-over]:brightness-105 active:scale-[0.97] data-[ghost-press]:scale-[0.97]",
          )}
        >
          <BoltGlyph className={cx("size-[13px]", map.spiking && !reduced && "animate-pulse")} />
          {map.spiking ? copy.spike.running : copy.spike.label}
        </button>
      </span>
    </Toolbar>
  );
}

type OpsWindowProps = Readonly<{
  copy: ServiceMapCopy;
  parts: ServiceMapParts;
  live: boolean;
  reduced: boolean;
  /** The live region's last sentence. */
  message: string;
}>;

/**
 * The ops app's window, its top-right part in view: the edge of a translucent sidebar at the crop, the
 * toolbar, and the service map filling the rest.
 */
export function OpsWindow({ copy, parts, live, reduced, message }: OpsWindowProps): ReactNode {
  const { runner, layout, painter } = parts;
  const map = useSyncExternalStore(runner.subscribe, runner.snapshot, runner.snapshot);
  return (
    <AppWindowChrome corner={CORNER} size={SIZE}>
      <OpsSidebar copy={copy} map={map} />
      <div className="absolute inset-y-0 left-[200px] right-0 flex flex-col bg-white">
        <MapToolbar copy={copy} map={map} live={live} reduced={reduced} onSpike={() => runner.spike()} />
        <MapCanvas copy={copy} map={map} layout={layout} painter={painter} reduced={reduced} onTakeDown={(service) => runner.takeDown(service)} />
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </AppWindowChrome>
  );
}
