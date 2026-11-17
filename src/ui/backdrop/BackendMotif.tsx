import type { ReactNode } from "react";
import type { DrawingPoint } from "../illustrations";
import { PathTraveller } from "../illustrations/PathTraveller";
import { insetSegment, midpointOf, segmentPath, type Segment } from "./MotifGeometry";
import { INK_CLASS, INK_OPACITY, SIGNAL_OPACITY } from "./MotifInk";

const WIDTH = 800;
const HEIGHT = 640;
/** How far a link stops short of a node's centre. */
const NODE_CLEARANCE = 36;

type NodeKind = "hub" | "service" | "store";

type NetworkNode = Readonly<{ id: string; kind: NodeKind; at: DrawingPoint }>;

/** A packet on a link: which link, how long a trip takes, and how far into its loop it starts. */
type Packet = Readonly<{ from: string; to: string; seconds: number; head: number }>;

const NODES: readonly NetworkNode[] = [
  { id: "gateway", kind: "hub", at: { x: 420, y: 80 } },
  { id: "orders", kind: "service", at: { x: 230, y: 190 } },
  { id: "payments", kind: "service", at: { x: 600, y: 180 } },
  { id: "bus", kind: "hub", at: { x: 410, y: 330 } },
  { id: "inventory", kind: "service", at: { x: 700, y: 360 } },
  { id: "shipping", kind: "service", at: { x: 190, y: 430 } },
  { id: "worker", kind: "service", at: { x: 590, y: 480 } },
  { id: "db", kind: "store", at: { x: 340, y: 570 } },
  { id: "cache", kind: "store", at: { x: 740, y: 590 } },
];

const LINKS: readonly (readonly [string, string])[] = [
  ["gateway", "orders"],
  ["gateway", "payments"],
  ["orders", "bus"],
  ["payments", "bus"],
  ["payments", "inventory"],
  ["bus", "shipping"],
  ["bus", "worker"],
  ["inventory", "worker"],
  ["shipping", "db"],
  ["worker", "db"],
  ["worker", "cache"],
];

const PACKETS: readonly Packet[] = [
  { from: "gateway", to: "payments", seconds: 5.5, head: 0 },
  { from: "bus", to: "worker", seconds: 6.5, head: 2.2 },
  { from: "shipping", to: "db", seconds: 4.8, head: 3.6 },
];

function nodeAt(id: string): DrawingPoint {
  const node = NODES.find((candidate) => candidate.id === id);
  if (node === undefined) {
    throw new Error(`No node ${id} in the backend motif`);
  }
  return node.at;
}

function linkBetween(from: string, to: string): Segment {
  return insetSegment(nodeAt(from), nodeAt(to), NODE_CLEARANCE);
}

function NodeShape({ kind }: Readonly<{ kind: NodeKind }>): ReactNode {
  switch (kind) {
    case "hub":
      return (
        <>
          <circle r={26} strokeWidth={1.5} />
          <circle r={9} />
          <circle r={2.5} fill="currentColor" />
        </>
      );
    case "service":
      return (
        <>
          <rect x={-26} y={-26} width={52} height={52} rx={10} strokeWidth={1.5} />
          <g fill="currentColor" stroke="none">
            <rect x={-14} y={-11} width={28} height={4} rx={2} />
            <rect x={-14} y={-2} width={20} height={4} rx={2} />
            <rect x={-14} y={7} width={24} height={4} rx={2} />
          </g>
        </>
      );
    case "store":
      return (
        <>
          <path d="M-24 -16 V16 A24 7 0 0 0 24 16 V-16" strokeWidth={1.5} />
          <ellipse cy={-16} rx={24} ry={7} strokeWidth={1.5} />
          <path d="M-24 0 A24 7 0 0 0 24 0" />
        </>
      );
    default:
      return assertNever(kind);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled node kind: ${String(value)}`);
}

/** Back end: a sparse service network, with orange packets travelling a few of its links. */
export function BackendMotif(): ReactNode {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="block aspect-[5/4] h-auto w-full overflow-visible"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <g className={INK_CLASS} stroke="currentColor" opacity={INK_OPACITY}>
        {LINKS.map(([from, to]) => (
          <path key={`${from}-${to}`} d={segmentPath(linkBetween(from, to))} strokeWidth={1.25} />
        ))}
        {NODES.map((node) => (
          <g key={node.id} transform={`translate(${node.at.x} ${node.at.y})`}>
            <NodeShape kind={node.kind} />
          </g>
        ))}
      </g>
      <g className="fill-signal" opacity={SIGNAL_OPACITY + 0.2}>
        {PACKETS.map((packet) => {
          const link = linkBetween(packet.from, packet.to);
          return (
            <PathTraveller
              key={`${packet.from}-${packet.to}`}
              path={segmentPath(link)}
              seconds={packet.seconds}
              head={packet.head}
              rest={midpointOf(link)}
              easing="ease-in-out"
              fade
            >
              <rect x={-7} y={-4.5} width={14} height={9} rx={2.5} />
            </PathTraveller>
          );
        })}
      </g>
    </svg>
  );
}
