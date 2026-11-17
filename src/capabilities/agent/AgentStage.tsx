import { memo, type ReactNode } from "react";
import type { AgentPanel, AgentStationId } from "@/content";
import { cx } from "@/ui";
import { AGENT_HEIGHT, AgentFigure, TicketCard } from "./AgentFigure";
import type { AgentPose } from "./AgentPose";
import type { AgentFrame } from "./AgentTimeline";
import { squashStretch, type Scale2 } from "./easing";
import { confettiAt, flyingTicket, type ConfettiPiece } from "./shipEffects";
import { SpeechBubble } from "./SpeechBubble";
import type { StageLayout } from "./StageLayout";
import { StationTile } from "./StationTile";

/** A tile at rest. */
const UNSQUASHED: Scale2 = { x: 1, y: 1 };
/** The agent's click target, in stage units. */
const HIT = { width: 46, height: AGENT_HEIGHT + 6 } as const;

/** A percentage of `total`, for positions in CSS. */
function percent(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(3)}%`;
}

/** The station names under the tiles, in HTML so they stay crisp; they never move. */
const StationLabels = memo(function StationLabels({
  layout,
  names,
  lit,
}: Readonly<{ layout: StageLayout; names: AgentPanel["stations"]; lit: AgentStationId | null }>): ReactNode {
  const { width, height } = layout.size();
  return (
    <>
      {layout.stations().map((station) => {
        const tile = layout.tile(station);
        return (
          <span
            key={station}
            aria-hidden
            className={cx(
              "absolute -translate-x-1/2 whitespace-nowrap font-label text-[11px] font-medium uppercase leading-none tracking-[0.12em] transition-colors duration-300 motion-reduce:transition-none",
              station === lit ? "text-signal-ink" : "text-mute",
            )}
            style={{ left: percent(tile.x + tile.width / 2, width), top: percent(tile.y + tile.height + 10, height) }}
          >
            {names[station]}
          </span>
        );
      })}
    </>
  );
});

/** A bit of confetti. */
function Confetto({ piece }: Readonly<{ piece: ConfettiPiece }>): ReactNode {
  const fill = piece.tone === "signal" ? "fill-signal" : "fill-ink";
  return (
    <g transform={`translate(${piece.x} ${piece.y}) rotate(${piece.rotate})`} opacity={piece.opacity}>
      {piece.shape === "dot" ? (
        <circle r={2.6} className={fill} />
      ) : (
        <rect x={-1.6} y={-4} width={3.2} height={8} rx={1.4} className={fill} />
      )}
    </g>
  );
}

/** The ship pop: confetti thrown up from the mailbox and a check badge that springs in on its corner. */
function ShipPop({ layout, pop }: Readonly<{ layout: StageLayout; pop: number }>): ReactNode {
  const box = layout.tile("ship");
  const badgeIn = Math.min(1, pop / 0.3);
  const badgeOut = pop < 0.75 ? 1 : Math.max(0, 1 - (pop - 0.75) / 0.25);
  const badge = (1 + 0.35 * Math.sin(Math.PI * badgeIn) * (1 - badgeIn)) * badgeIn;
  return (
    <g>
      <g transform={`translate(${box.x + box.width / 2} ${box.y + 6})`}>
        {confettiAt(pop).map((piece, index) => (
          <Confetto key={index} piece={piece} />
        ))}
      </g>
      <g transform={`translate(${box.x + box.width - 4} ${box.y + 4}) scale(${badge})`} opacity={badgeOut}>
        <circle r={9.5} strokeWidth={2} className="fill-ink stroke-white" />
        <path d="m-4 0.3 2.7 2.7 5.3-5.6" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="stroke-white" />
      </g>
    </g>
  );
}

type AgentStageProps = Readonly<{
  layout: StageLayout;
  frame: AgentFrame;
  pose: AgentPose;
  names: AgentPanel["stations"];
  /** The accessible name of the agent's button. */
  greetLabel: string;
  onGreet: () => void;
}>;

/**
 * The stage: the dashed lanes, the station tiles, the agent and its ticket in one SVG, with the labels,
 * the speech bubble and the agent's click target laid over it in HTML. Its aspect ratio is the layout's,
 * so stage units and percentages line up at any width.
 */
export function AgentStage({ layout, frame, pose, names, greetLabel, onGreet }: AgentStageProps): ReactNode {
  const { width, height } = layout.size();
  const flying = flyingTicket(frame.hold, layout);
  const shipSquash = frame.pop === null ? UNSQUASHED : squashStretch(frame.pop);
  const head = { x: frame.position.x / width, y: (frame.position.y - frame.lift - AGENT_HEIGHT - 2) / height };
  const feet = { x: percent(frame.position.x, width), y: percent(frame.position.y - frame.lift + 3, height) };

  return (
    <div
      className={cx("relative mx-auto w-full", layout.kind() === "compact" && "max-w-[22rem]")}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg aria-hidden viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 size-full overflow-visible">
        {layout.lanes().map((lane, index) => (
          <path
            key={index}
            d={`M${lane.from.x} ${lane.from.y + 2}H${lane.to.x}`}
            strokeWidth={1.2}
            strokeDasharray="2 6"
            strokeLinecap="round"
            className="stroke-ink/20"
          />
        ))}
        {layout.stations().map((station) => (
          <StationTile
            key={station}
            station={station}
            tile={layout.tile(station)}
            lit={frame.lit === station}
            squash={station === "ship" ? shipSquash : UNSQUASHED}
          />
        ))}
        {frame.pop === null ? null : <ShipPop layout={layout} pop={frame.pop} />}
        <AgentFigure
          x={frame.position.x}
          y={frame.position.y}
          lift={frame.lift}
          pose={pose}
          holding={frame.hold.kind === "held"}
        />
        {flying === null ? null : (
          <g transform={`translate(${flying.x} ${flying.y}) scale(${flying.scale})`} opacity={flying.opacity}>
            <TicketCard />
          </g>
        )}
      </svg>

      <StationLabels layout={layout} names={names} lit={frame.lit} />
      <SpeechBubble bubble={frame.bubble} anchor={head} />

      <div className="pointer-events-none absolute inset-0" style={{ transform: `translate(${feet.x}, ${feet.y})` }}>
        <button
          type="button"
          aria-label={greetLabel}
          onClick={onGreet}
          className="pointer-events-auto absolute left-0 top-0 -translate-x-1/2 -translate-y-full cursor-pointer rounded-[40%]"
          style={{ width: percent(HIT.width, width), height: percent(HIT.height, height) }}
        />
      </div>
    </div>
  );
}
