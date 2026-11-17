import type { ReactNode } from "react";
import { assertNever } from "./assertNever";
import type { Bubble } from "./AgentTimeline";

/** A small check or cross before a test result. */
function Verdict({ passed }: Readonly<{ passed: boolean }>): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className="mr-1 inline size-3 align-[-1px]">
      <path
        d={passed ? "m2.5 6.3 2.3 2.3 4.7-5" : "m3 3 6 6M9 3 3 9"}
        fill="none"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={passed ? "stroke-signal" : "stroke-signal-ink"}
      />
    </svg>
  );
}

/** A thin dot between a call and what it returned. */
function Joint(): ReactNode {
  return <span className="mx-1.5 text-mute">·</span>;
}

/** What the bubble says, styled by its tone. */
function Words({ bubble }: Readonly<{ bubble: Bubble }>): ReactNode {
  switch (bubble.tone) {
    case "ticket":
      return (
        <>
          <span className="font-semibold text-signal-ink">{bubble.text}</span>
          <Joint />
          <span>{bubble.result}</span>
        </>
      );
    case "call":
      return <span>{bubble.text}</span>;
    case "passed":
      return (
        <>
          <span>{bubble.text}</span>
          <Joint />
          <span className="font-semibold">
            <Verdict passed />
            {bubble.result}
          </span>
        </>
      );
    case "failed":
      return (
        <>
          <span>{bubble.text}</span>
          <Joint />
          <span className="font-semibold text-signal-ink">
            <Verdict passed={false} />
            {bubble.result}
          </span>
        </>
      );
    case "hello":
      return <span className="px-1 text-[15px] font-semibold tracking-[-0.01em]">{bubble.text}</span>;
    default:
      return assertNever(bubble.tone);
  }
}

type SpeechBubbleProps = Readonly<{
  bubble: Bubble | null;
  /** Where the tail points (over the agent's head), as fractions of the stage's width and height. */
  anchor: Readonly<{ x: number; y: number }>;
}>;

/**
 * The agent's speech bubble, in HTML so its words stay crisp at any size. It moves with transforms only:
 * a stage-sized layer is shifted to the anchor, and the bubble slides along its own width as the agent
 * crosses the stage, so it never spills over either edge while its tail stays over the agent's head.
 */
export function SpeechBubble({ bubble, anchor }: SpeechBubbleProps): ReactNode {
  if (bubble === null) {
    return null;
  }
  const across = `${(anchor.x * 100).toFixed(3)}%`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ transform: `translate(${across}, ${(anchor.y * 100).toFixed(3)}%)` }}
    >
      <div className="absolute left-0 top-0 w-max max-w-full" style={{ transform: `translate(-${across}, -100%)` }}>
        <div
          key={bubble.key}
          className="relative mb-2.5 motion-safe:animate-[toy-bubble_320ms_cubic-bezier(0.34,1.56,0.64,1)_both]"
          style={{ transformOrigin: `${across} 100%` }}
        >
          <p className="whitespace-nowrap rounded-xl bg-white px-2.5 py-1.5 font-label text-[12px] font-medium leading-4 text-ink shadow-[0_8px_20px_-10px_rgb(14_14_14/0.35)] ring-1 ring-line">
            <Words bubble={bubble} />
          </p>
          <span
            className="absolute top-full size-2.5 -translate-x-1/2 -translate-y-[5px] rotate-45 border-b border-r border-line bg-white"
            style={{ left: `clamp(14px, ${across}, calc(100% - 14px))` }}
          />
        </div>
      </div>
    </div>
  );
}
