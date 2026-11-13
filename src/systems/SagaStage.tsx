"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import type { Systems } from "@/content";
import { cx } from "@/ui";
import { DiagramLayout, type Orientation, type Point } from "./DiagramLayout";
import { serviceNode, type NodeId, type Outcome, type SagaFrame, type ServiceStatus } from "./SagaSequencer";
import type { SpokeHighlighter } from "./SpokeHighlighter";
import { StatusLight } from "./StatusLight";

const GATEWAY_TAG = "JWT";
const EDGE_LABEL = "HTTP";
const HUB_IDLE_CAPTION = "Saga state";

const STATUS_WORDS: Readonly<Record<ServiceStatus, string>> = {
  idle: "idle",
  running: "running",
  done: "done",
  failed: "failed",
  compensating: "compensating",
  compensated: "compensated",
};

const MAX_WIDTH_CLASSES: Readonly<Record<Orientation, string>> = {
  wide: "max-w-[1120px]",
  narrow: "max-w-[440px]",
};

type SagaStageProps = Readonly<{
  orientation: Orientation;
  layout: DiagramLayout;
  edge: Systems["edge"];
  steps: Systems["steps"];
  frame: SagaFrame;
  outcomeLabel: string;
  tokenRef: RefObject<HTMLDivElement | null>;
  highlighter: SpokeHighlighter;
  className?: string;
}>;

function percent(value: number): string {
  return `${Math.round(value * 10000) / 100}%`;
}

function polyline(layout: DiagramLayout, points: readonly Point[]): string {
  return points
    .map((point) => {
      const unit = layout.toUnits(point);
      return `${Math.round(unit.x * 100) / 100},${Math.round(unit.y * 100) / 100}`;
    })
    .join(" ");
}

/** Cards grow past their nominal width rather than wrap; the hub is fixed so its caption wraps instead. */
function anchorStyle(layout: DiagramLayout, id: NodeId, fixedWidth: boolean): CSSProperties {
  const box = layout.box(id);
  return {
    left: percent(box.x),
    top: percent(box.y),
    ...(fixedWidth ? { width: percent(box.width) } : { minWidth: percent(box.width) }),
    transform: "translate(-50%, -50%)",
  };
}

function centreStyle(point: Point): CSSProperties {
  return { left: percent(point.x), top: percent(point.y), transform: "translate(-50%, -50%)" };
}

type NodeCardProps = Readonly<{
  layout: DiagramLayout;
  id: NodeId;
  children: ReactNode;
  tone?: "plain" | "hub" | "failed" | "working";
}>;

const CARD_TONES: Readonly<Record<NonNullable<NodeCardProps["tone"]>, string>> = {
  plain: "border-line-strong",
  hub: "border-signal",
  failed: "border-signal",
  working: "border-ink",
};

function NodeCard({ layout, id, children, tone = "plain" }: NodeCardProps): ReactNode {
  return (
    <div className="absolute z-10" style={anchorStyle(layout, id, tone === "hub")}>
      <motion.div
        animate={tone === "failed" ? { x: [0, -7, 7, -5, 5, -2, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className={cx(
          "flex flex-col items-start gap-1 rounded-[6px] border bg-paper-raised px-3 py-2.5 transition-colors duration-300",
          tone === "hub" ? "" : "whitespace-nowrap",
          CARD_TONES[tone],
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

function NodeName({ children }: { readonly children: ReactNode }): ReactNode {
  return <span className="font-display text-[15px] font-semibold leading-tight tracking-[-0.02em] text-ink">{children}</span>;
}

function Caption({ children, signal = false }: { readonly children: ReactNode; readonly signal?: boolean }): ReactNode {
  return (
    <span
      className={cx(
        "font-mono text-[10px] uppercase leading-snug tracking-[0.12em] transition-colors duration-300",
        signal ? "text-signal-ink" : "text-mute",
      )}
    >
      {children}
    </span>
  );
}

function MonoTag({ children, style }: { readonly children: ReactNode; readonly style: CSSProperties }): ReactNode {
  return (
    <span
      className="absolute z-10 bg-paper-sunk px-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft"
      style={style}
    >
      {children}
    </span>
  );
}

function toneFor(status: ServiceStatus): NonNullable<NodeCardProps["tone"]> {
  switch (status) {
    case "failed":
      return "failed";
    case "running":
      return "working";
    case "idle":
    case "done":
    case "compensating":
    case "compensated":
      return "plain";
    default: {
      const unreachable: never = status;
      throw new Error(`Unhandled status: ${String(unreachable)}`);
    }
  }
}

function hubCaption(outcome: Outcome, outcomeLabel: string): string {
  return outcome === "idle" ? HUB_IDLE_CAPTION : outcomeLabel;
}

/** One orientation of the diagram: ring, wires, node cards and the token's slot. Pure presentation. */
export function SagaStage({
  orientation,
  layout,
  edge,
  steps,
  frame,
  outcomeLabel,
  tokenRef,
  highlighter,
  className,
}: SagaStageProps): ReactNode {
  const ring = layout.ring;
  const ringLabel = layout.ringLabelPoint();
  const edgeLabel = layout.edgeLabelPoint();
  const wide = orientation === "wide";

  return (
    <div
      className={cx("relative mx-auto w-full", MAX_WIDTH_CLASSES[orientation], className)}
      style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
    >
      <svg aria-hidden className="absolute inset-0 size-full" viewBox={`0 0 ${layout.width} ${layout.height}`}>
        <circle cx={ring.cx} cy={ring.cy} r={ring.radius} fill="none" className="stroke-line-strong" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {layout.edgeWires().map((wire) => (
          <polyline
            key={polyline(layout, wire)}
            points={polyline(layout, wire)}
            fill="none"
            className="stroke-line-strong"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {layout.spokes().map((spoke, index) => (
          <polyline
            key={polyline(layout, spoke)}
            ref={(element) => highlighter.register(index, element)}
            points={polyline(layout, spoke)}
            fill="none"
            className="stroke-line-strong transition-[stroke] duration-300 data-[active=true]:stroke-signal"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <MonoTag style={centreStyle(ringLabel)}>{edge.bus}</MonoTag>
      <MonoTag
        style={{
          left: percent(edgeLabel.x),
          top: percent(edgeLabel.y),
          transform: wide ? "translate(-50%, -150%)" : "translate(10px, -50%)",
        }}
      >
        {EDGE_LABEL}
      </MonoTag>

      <NodeCard layout={layout} id="client">
        <NodeName>{edge.client}</NodeName>
      </NodeCard>

      <NodeCard layout={layout} id="gateway">
        <div className="flex items-center gap-2.5">
          <NodeName>{edge.gateway}</NodeName>
          <span className="rounded-[3px] border border-line-strong px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-[0.12em] text-ink-soft">
            {GATEWAY_TAG}
          </span>
        </div>
      </NodeCard>

      <NodeCard layout={layout} id="orchestrator" tone="hub">
        <NodeName>{edge.orchestrator}</NodeName>
        <Caption signal={frame.outcome === "rolledBack"}>{hubCaption(frame.outcome, outcomeLabel)}</Caption>
      </NodeCard>

      {steps.map((step, index) => {
        const status = frame.statuses[index];
        const undoing = status === "compensating" || status === "compensated";
        return (
          <NodeCard key={step.service} layout={layout} id={serviceNode(index)} tone={toneFor(status)}>
            <div className="flex items-center gap-2">
              <StatusLight status={status} />
              <NodeName>{step.service}</NodeName>
            </div>
            <Caption signal={undoing}>{undoing ? step.compensation : step.action}</Caption>
            <span className="sr-only">{STATUS_WORDS[status]}</span>
          </NodeCard>
        );
      })}

      <div
        ref={tokenRef}
        aria-hidden
        data-tone="forward"
        className="pointer-events-none absolute z-[5] size-2.5 bg-signal opacity-0 data-[tone=compensation]:border-2 data-[tone=compensation]:border-signal data-[tone=compensation]:bg-paper-raised"
        style={{ transform: "translate(-50%, -50%)" }}
      />
    </div>
  );
}
