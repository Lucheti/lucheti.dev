import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";
import { INK_CLASS, INK_OPACITY, SIGNAL_OPACITY } from "./MotifInk";

/** The motif's own coordinate space; every fragment is placed in it. */
const WIDTH = 800;
const HEIGHT = 640;

type Placement = Readonly<{ x: number; y: number; width: number; height: number }>;

type FragmentProps = Readonly<{
  at: Placement;
  /** A Tailwind animation class, always behind motion-safe:. */
  drift: string;
  /** Seconds into the drift at first paint, so the fragments never move in step. */
  head: number;
  children: ReactNode;
}>;

function percent(part: number, whole: number): string {
  return `${(part / whole) * 100}%`;
}

/**
 * One wireframe fragment as its own small SVG, so its drift is a transform on
 * an HTML box: composited, with no repaint of the rest of the motif.
 */
function Fragment({ at, drift, head, children }: FragmentProps): ReactNode {
  const style: CSSProperties = {
    left: percent(at.x, WIDTH),
    top: percent(at.y, HEIGHT),
    width: percent(at.width, WIDTH),
    animationDelay: `${-head}s`,
  };
  return (
    <svg
      viewBox={`0 0 ${at.width} ${at.height}`}
      className={cx("absolute h-auto overflow-visible", drift)}
      style={style}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** A content card: avatar, title lines, an image placeholder and a button. */
function Card(): ReactNode {
  return (
    <g className={INK_CLASS} stroke="currentColor" opacity={INK_OPACITY} strokeWidth={1.5}>
      <rect x={1} y={1} width={298} height={198} rx={14} />
      <circle cx={34} cy={36} r={14} />
      <rect x={18} y={66} width={264} height={70} rx={8} />
      <path d="M18 66 L282 136 M282 66 L18 136" strokeWidth={1} />
      <rect x={196} y={152} width={86} height={30} rx={15} />
      <g fill="currentColor" stroke="none">
        <rect x={58} y={26} width={110} height={8} rx={4} />
        <rect x={58} y={42} width={70} height={6} rx={3} />
        <rect x={18} y={154} width={150} height={6} rx={3} />
        <rect x={18} y={168} width={100} height={6} rx={3} />
      </g>
    </g>
  );
}

/** A switch, on, with its label lines. */
function Toggle(): ReactNode {
  return (
    <g className={INK_CLASS} stroke="currentColor" opacity={INK_OPACITY} strokeWidth={1.5}>
      <rect x={2} y={2} width={100} height={52} rx={26} />
      <circle cx={76} cy={28} r={18} fill="currentColor" stroke="none" />
      <g fill="currentColor" stroke="none">
        <rect x={124} y={17} width={96} height={8} rx={4} />
        <rect x={124} y={33} width={62} height={6} rx={3} />
      </g>
    </g>
  );
}

/** A pill button with its label. */
function Button(): ReactNode {
  return (
    <g className={INK_CLASS} stroke="currentColor" opacity={INK_OPACITY} strokeWidth={1.5}>
      <rect x={1} y={1} width={198} height={58} rx={29} />
      <rect x={60} y={26} width={80} height={8} rx={4} fill="currentColor" stroke="none" />
    </g>
  );
}

/** A range slider, part filled. */
function Slider(): ReactNode {
  return (
    <g className={INK_CLASS} stroke="currentColor" opacity={INK_OPACITY}>
      <line x1={10} y1={20} x2={137} y2={20} strokeWidth={4} />
      <line x1={163} y1={20} x2={250} y2={20} strokeWidth={1.5} />
      <circle cx={150} cy={20} r={11} strokeWidth={1.5} />
    </g>
  );
}

/** A heading block under a design-tool selection: dashed box, eight handles, smart guides and its size. */
function Selection(): ReactNode {
  const box = { x: 14, y: 18, width: 272, height: 110 };
  const xs = [box.x, box.x + box.width / 2, box.x + box.width];
  const ys = [box.y, box.y + box.height / 2, box.y + box.height];
  const handles = xs.flatMap((x) => ys.map((y) => ({ x, y }))).filter(({ x, y }) => x !== xs[1] || y !== ys[1]);
  return (
    <>
      <g className={INK_CLASS} opacity={INK_OPACITY}>
        <g fill="currentColor">
          <rect x={30} y={34} width={200} height={16} rx={4} />
          <rect x={30} y={60} width={150} height={16} rx={4} />
          <rect x={30} y={94} width={230} height={6} rx={3} />
          <rect x={30} y={108} width={180} height={6} rx={3} />
        </g>
        <g stroke="currentColor" strokeDasharray="3 7">
          <line x1={-260} y1={box.y} x2={560} y2={box.y} />
          <line x1={box.x} y1={-420} x2={box.x} y2={240} />
        </g>
      </g>
      <g className="text-signal" opacity={SIGNAL_OPACITY}>
        <rect
          x={box.x}
          y={box.y}
          width={box.width}
          height={box.height}
          stroke="currentColor"
          strokeWidth={1.25}
          strokeDasharray="6 5"
        />
        {handles.map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x - 4.5}
            y={y - 4.5}
            width={9}
            height={9}
            rx={1.5}
            className="fill-paper-raised"
            stroke="currentColor"
            strokeWidth={1.25}
          />
        ))}
        <rect x={box.x} y={box.y + box.height + 12} width={88} height={22} rx={4} fill="currentColor" />
        <text
          x={box.x + 44}
          y={box.y + box.height + 23}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={11}
          letterSpacing="0.04em"
          className="fill-paper-raised font-label font-medium"
        >
          {`${box.width} × ${box.height}`}
        </text>
      </g>
    </>
  );
}

/** The pointer, heading for the selection. */
function Cursor(): ReactNode {
  return (
    <g className={INK_CLASS} opacity={INK_OPACITY * 1.6}>
      <path
        d="M2 2 L2 36 L11 27.5 L17 41 L23 38.5 L17.5 25.5 L30 25.5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </g>
  );
}

/** Front end: wireframe UI fragments (a card, a toggle, a button, a slider, a selection and a cursor) drifting slowly. */
export function FrontendMotif(): ReactNode {
  return (
    <div className="relative aspect-[5/4] w-full">
      <Fragment
        at={{ x: 440, y: 30, width: 300, height: 200 }}
        drift="motion-safe:animate-[backdrop-float-a_19s_ease-in-out_infinite_alternate]"
        head={3}
      >
        <Card />
      </Fragment>
      <Fragment
        at={{ x: 150, y: 120, width: 222, height: 56 }}
        drift="motion-safe:animate-[backdrop-float-b_15s_ease-in-out_infinite_alternate]"
        head={7}
      >
        <Toggle />
      </Fragment>
      <Fragment
        at={{ x: 100, y: 290, width: 260, height: 40 }}
        drift="motion-safe:animate-[backdrop-float-b_18s_ease-in-out_infinite_alternate]"
        head={2}
      >
        <Slider />
      </Fragment>
      <Fragment
        at={{ x: 520, y: 300, width: 200, height: 60 }}
        drift="motion-safe:animate-[backdrop-float-a_22s_ease-in-out_infinite_alternate]"
        head={11}
      >
        <Button />
      </Fragment>
      <Fragment
        at={{ x: 230, y: 410, width: 300, height: 160 }}
        drift="motion-safe:animate-[backdrop-float-b_26s_ease-in-out_infinite_alternate]"
        head={5}
      >
        <Selection />
      </Fragment>
      <Fragment
        at={{ x: 556, y: 520, width: 32, height: 44 }}
        drift="motion-safe:animate-[backdrop-float-c_9s_ease-in-out_infinite_alternate]"
        head={0}
      >
        <Cursor />
      </Fragment>
    </div>
  );
}
