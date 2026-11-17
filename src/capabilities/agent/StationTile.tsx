import { memo, type ReactNode } from "react";
import type { AgentStationId } from "@/content";
import { cx } from "@/ui";
import { assertNever } from "./assertNever";
import type { Scale2 } from "./easing";
import type { Rect } from "./StageLayout";

/** The icon of a station, drawn in a 24-unit box with the tile's stroke. */
function StationGlyph({ station, lit }: Readonly<{ station: AgentStationId; lit: boolean }>): ReactNode {
  switch (station) {
    case "inbox":
      return (
        <>
          <path d="M3 13.5 5.6 6h12.8l2.6 7.5V19H3z" />
          <path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5" />
        </>
      );
    case "read":
      return (
        <>
          <path d="M6.5 3H14l4 4v14H6.5z" />
          <path d="M14 3v4h4M9.5 12h5.5M9.5 15.5h4" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="10.5" cy="10.5" r="6" />
          <path d="m15 15 5.5 5.5" />
        </>
      );
    case "code":
      return <path d="M8 7.5 3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.5 5.5l-3 13" />;
    case "test":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8.2 12.4 2.6 2.6 5.2-5.6" />
        </>
      );
    case "ship":
      return (
        <>
          <path d="M2.5 20v-8.5A4.5 4.5 0 0 1 7 7h9.5a4.5 4.5 0 0 1 4.5 4.5V20z" />
          <path d="M7 7a4.5 4.5 0 0 1 4.5 4.5V20M4.5 12.5h4" />
          <g
            className="transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transformOrigin: "17px 15px", transform: lit ? "rotate(0deg)" : "rotate(90deg)" }}
          >
            <path d="M17 15V3.5" />
            <path d="M17 3.5h4v3.2h-4z" className={lit ? "fill-white" : "fill-signal"} />
          </g>
        </>
      );
    default:
      return assertNever(station);
  }
}

type StationTileProps = Readonly<{
  station: AgentStationId;
  tile: Rect;
  /** Lit orange while the agent works at it. */
  lit: boolean;
  /** Squash and stretch about its base, for the ship pop. */
  squash: Scale2;
}>;

/**
 * One station: a small white kiosk with a lip underneath and its icon on the face. While the agent works
 * at it, it lights signal orange with a soft glow.
 */
export const StationTile = memo(function StationTile({ station, tile, lit, squash }: StationTileProps): ReactNode {
  const centreX = tile.x + tile.width / 2;
  const base = tile.y + tile.height + 4;
  const paint = "transition-[fill,stroke,opacity] duration-300 motion-reduce:transition-none";
  return (
    <g transform={`translate(${centreX} ${base}) scale(${squash.x} ${squash.y}) translate(${-centreX} ${-base})`}>
      <rect
        x={tile.x - 6}
        y={tile.y - 6}
        width={tile.width + 12}
        height={tile.height + 16}
        rx={20}
        className={cx("fill-signal", paint, lit ? "opacity-20" : "opacity-0")}
      />
      <rect
        x={tile.x}
        y={tile.y + 4}
        width={tile.width}
        height={tile.height}
        rx={15}
        className={cx(paint, lit ? "fill-signal-ink" : "fill-paper-sunk")}
      />
      <rect
        x={tile.x + 0.5}
        y={tile.y + 0.5}
        width={tile.width - 1}
        height={tile.height - 1}
        rx={14.5}
        strokeWidth={1}
        className={cx(paint, lit ? "fill-signal stroke-signal-ink" : "fill-white stroke-line-strong")}
      />
      <g
        transform={`translate(${centreX - 12} ${tile.y + tile.height / 2 - 12})`}
        fill="none"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-ink"
      >
        <StationGlyph station={station} lit={lit} />
      </g>
    </g>
  );
});
