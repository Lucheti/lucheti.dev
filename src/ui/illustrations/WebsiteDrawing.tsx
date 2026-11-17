import type { ReactNode } from "react";
import { BOX, DrawingSvg, SECONDARY } from "./DrawingSvg";

/** A browser window: headline bars on the left, an orange disc and a faceted polygon on the right. */
export function WebsiteDrawing(): ReactNode {
  return (
    <DrawingSvg>
      <rect x={32} y={24} width={256} height={132} rx={6} className={BOX} strokeWidth={1.25} />
      <line x1={32} y1={44} x2={288} y2={44} className="stroke-ink" />
      <g className={SECONDARY}>
        <circle cx={46} cy={34} r={2.5} />
        <circle cx={55} cy={34} r={2.5} />
        <circle cx={64} cy={34} r={2.5} />
        <rect x={88} y={29} width={112} height={10} rx={5} />
      </g>

      <rect x={52} y={72} width={112} height={14} rx={3} className="fill-ink" />
      <rect x={52} y={94} width={84} height={14} rx={3} className="fill-ink" />
      <rect x={52} y={122} width={76} height={4} rx={2} className="fill-line-strong" />
      <rect x={52} y={132} width={52} height={4} rx={2} className="fill-line-strong" />

      <circle cx={226} cy={98} r={30} className="fill-signal" />
      <circle
        cx={226}
        cy={98}
        r={38}
        className="stroke-signal [transform-box:fill-box] origin-center motion-safe:animate-[repo-pulse_3.2s_ease-in-out_infinite]"
      />

      <polygon points="190,118 202,100 222,100 234,118 222,136 202,136" className="fill-paper stroke-ink" strokeWidth={1.25} />
      <g className={SECONDARY}>
        <line x1={202} y1={100} x2={212} y2={118} />
        <line x1={222} y1={100} x2={212} y2={118} />
        <line x1={190} y1={118} x2={212} y2={118} />
        <line x1={234} y1={118} x2={212} y2={118} />
        <line x1={202} y1={136} x2={212} y2={118} />
        <line x1={222} y1={136} x2={212} y2={118} />
      </g>
    </DrawingSvg>
  );
}
