import type { ReactNode } from "react";
import type { AgentPose, Eyes } from "./AgentPose";

/** The figure is drawn at this scale on the stage. */
const FIGURE_SCALE = 1.2;
/** The agent is this tall, feet to antenna tip, in stage units. */
export const AGENT_HEIGHT = 64 * FIGURE_SCALE;

/** The ticket card: white, an orange header stripe, two lines of text. Centred on the origin. */
export function TicketCard(): ReactNode {
  return (
    <g>
      <rect x={-10} y={-7} width={20} height={14} rx={2.5} className="fill-white" />
      <path d="M-10 -3V-4.5A2.5 2.5 0 0 1-7.5 -7h15A2.5 2.5 0 0 1 10 -4.5V-3z" className="fill-signal" />
      <path d="M-6 0.5h12M-6 3.5h7" strokeWidth={1.2} strokeLinecap="round" className="stroke-ink/45" />
      <rect x={-10} y={-7} width={20} height={14} rx={2.5} fill="none" strokeWidth={1.3} className="stroke-ink" />
    </g>
  );
}

/** Two dots that blink and look about, or two happy arcs. */
function Face({ eyes }: Readonly<{ eyes: Eyes }>): ReactNode {
  const dx = eyes.x * 2.4;
  const dy = eyes.y * 1.8;
  if (eyes.happy) {
    return (
      <g fill="none" strokeWidth={1.6} strokeLinecap="round" className="stroke-ink">
        <path d="M-7.6 -32.4q2.5-3.4 5 0M2.6 -32.4q2.5-3.4 5 0" />
        <path d="M-3.4 -29.2q3.4 3.6 6.8 0" />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={-5 + dx} cy={-33.5 + dy} rx={2.2} ry={2.6 * eyes.open} className="fill-ink" />
      <ellipse cx={5 + dx} cy={-33.5 + dy} rx={2.2} ry={2.6 * eyes.open} className="fill-ink" />
      <path d="M-2.6 -28.8q2.6 2.3 5.2 0" fill="none" strokeWidth={1.3} strokeLinecap="round" className="stroke-ink" />
    </g>
  );
}

/** An arm from the shoulder, outlined in white so it reads against the ink body, with a round hand. */
function Arm({ side, angle }: Readonly<{ side: -1 | 1; angle: number }>): ReactNode {
  const shoulderX = 15.5 * side;
  return (
    <g transform={`rotate(${-side * angle} ${shoulderX} -27)`} strokeLinecap="round">
      <path d={`M${shoulderX} -27v11.5`} strokeWidth={7.5} className="stroke-white" />
      <path d={`M${shoulderX} -27v11.5`} strokeWidth={4.5} className="stroke-ink" />
    </g>
  );
}

type AgentFigureProps = Readonly<{
  /** The floor point under it. */
  x: number;
  y: number;
  /** How high it is off the floor. */
  lift: number;
  pose: AgentPose;
  /** Whether it carries the ticket in its hands. */
  holding: boolean;
}>;

/**
 * The agent: a rounded ink body with a white face, dot eyes, rosy orange cheeks and an antenna light,
 * on two stubby legs. Everything moves by transforms only: the bob, the lean, the squash and the limbs.
 */
export function AgentFigure({ x, y, lift, pose, holding }: AgentFigureProps): ReactNode {
  const height = lift + pose.bob;
  const shadow = Math.max(0.4, 1 - height / 60);
  return (
    <g>
      <ellipse
        rx={15 * FIGURE_SCALE}
        ry={3.4}
        transform={`translate(${x} ${y + 1}) scale(${shadow})`}
        className="fill-ink"
        opacity={0.13 * shadow + 0.03}
      />
      <g transform={`translate(${x} ${y - height}) scale(${FIGURE_SCALE})`}>
        <g transform={`rotate(${pose.tilt} 0 -26) scale(${pose.scale.x} ${pose.scale.y})`}>
          <rect x={-9.5} y={-12 - pose.feet[0]} width={7} height={12} rx={3.5} className="fill-ink" />
          <rect x={2.5} y={-12 - pose.feet[1]} width={7} height={12} rx={3.5} className="fill-ink" />
          <path d="M0 -47v-8" strokeWidth={2.2} strokeLinecap="round" className="stroke-ink" />
          <circle cy={-58.5} r={4 + 5 * pose.glow} className="fill-signal" opacity={0.28 * pose.glow} />
          <circle cy={-58.5} r={3.4} strokeWidth={1.2} className="fill-signal stroke-ink" />
          <rect x={-17} y={-48} width={34} height={40} rx={15} className="fill-ink" />
          <rect x={-12.5} y={-42.5} width={25} height={17.5} rx={8} className="fill-white" />
          <circle cx={-8.9} cy={-29.4} r={1.9} className="fill-signal/55" />
          <circle cx={8.9} cy={-29.4} r={1.9} className="fill-signal/55" />
          <Face eyes={pose.eyes} />
          {holding ? (
            <g transform="translate(0 -15)">
              <TicketCard />
            </g>
          ) : null}
          <Arm side={-1} angle={pose.arms.left} />
          <Arm side={1} angle={pose.arms.right} />
        </g>
      </g>
    </g>
  );
}
