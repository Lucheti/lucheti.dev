"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import type { Systems } from "@/content";
import { cx } from "@/ui";
import { DiagramLayout, type Orientation, type Point } from "./DiagramLayout";
import { serviceNode, type NodeId, type SagaFrame, type ServiceStatus } from "./SagaSequencer";
import { StatusLight } from "./StatusLight";

const SERVICE_CAPTION = "Postgres · Redis";
const ORCHESTRATOR_CAPTION = "Saga state";
const GATEWAY_TAG = "JWT";
const STEM_PX = 24;
const MAX_CARD_PX = 176;

const STATUS_WORDS: Readonly<Record<ServiceStatus, string>> = {
  idle: "idle",
  running: "running",
  done: "done",
  failed: "failed",
  compensating: "compensating",
  compensated: "compensated",
};

type SagaStageProps = Readonly<{
  orientation: Orientation;
  layout: DiagramLayout;
  edge: Systems["edge"];
  steps: Systems["steps"];
  frame: SagaFrame;
  tokenRef: RefObject<HTMLDivElement | null>;
  className?: string;
}>;

function percent(value: number): string {
  return `${Math.round(value * 10000) / 100}%`;
}

function polyline(points: readonly Point[]): string {
  return points.map((point) => `${Math.round(point.x * 10000) / 100},${Math.round(point.y * 10000) / 100}`).join(" ");
}

function anchorStyle(layout: DiagramLayout, id: NodeId, columns: boolean): CSSProperties {
  const point = layout.point(id);
  const placement = layout.placement(id);
  switch (placement) {
    case "centered":
      return { left: percent(point.x), top: percent(point.y), transform: "translate(-50%, -50%)" };
    case "hanging":
      return {
        left: percent(point.x),
        top: `calc(${percent(point.y)} + ${STEM_PX}px)`,
        transform: "translateX(-50%)",
        width: columns ? `min(${percent(layout.columnWidth - 0.02)}, ${MAX_CARD_PX}px)` : undefined,
      };
    case "beside":
      return { left: `calc(${percent(point.x)} + 28px)`, right: 0, top: percent(point.y), transform: "translateY(-50%)" };
    default: {
      const unreachable: never = placement;
      throw new Error(`Unhandled placement: ${String(unreachable)}`);
    }
  }
}

const STEM_CLASSES: Readonly<Record<"hanging" | "beside", string>> = {
  hanging: "-top-6 left-1/2 h-6 w-px",
  beside: "-left-7 top-1/2 h-px w-7",
};

type NodeCardProps = Readonly<{
  layout: DiagramLayout;
  id: NodeId;
  children: ReactNode;
  failed?: boolean;
}>;

function NodeCard({ layout, id, children, failed = false }: NodeCardProps): ReactNode {
  const placement = layout.placement(id);
  const stem = placement === "centered" ? null : <span aria-hidden className={cx("absolute bg-line-strong", STEM_CLASSES[placement])} />;
  return (
    <div className="absolute z-10" style={anchorStyle(layout, id, placement === "hanging")}>
      {stem}
      <motion.div
        animate={failed ? { x: [0, -7, 7, -5, 5, -2, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
        className={cx(
          "flex flex-col gap-1.5 rounded-[6px] border bg-paper-raised px-3.5 py-3 transition-colors duration-300",
          failed ? "border-signal" : "border-line-strong",
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

function Caption({ children }: { readonly children: ReactNode }): ReactNode {
  return <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mute">{children}</span>;
}

/** One orientation of the diagram: wires, node cards and the token's slot. Pure presentation. */
export function SagaStage({ orientation, layout, edge, steps, frame, tokenRef, className }: SagaStageProps): ReactNode {
  const horizontal = orientation === "horizontal";
  const busLabel = layout.busLabelPoint();

  return (
    <div className={cx("relative w-full", className)} style={{ height: layout.heightPx }}>
      <svg aria-hidden className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {horizontal ? (
          layout.edgeWires().map((wire) => (
            <polyline
              key={polyline(wire)}
              points={polyline(wire)}
              fill="none"
              className="stroke-line-strong"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))
        ) : (
          <polyline
            points={polyline([layout.point("client"), layout.point("orchestrator")])}
            fill="none"
            className="stroke-line-strong"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}
        <polyline points={polyline(layout.bus())} fill="none" className="stroke-ink" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>

      <span
        className={cx(
          "absolute z-10 bg-paper-sunk px-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft",
          horizontal ? "-translate-x-1/2 -translate-y-[170%]" : "-translate-y-1/2 translate-x-3",
        )}
        style={{ left: percent(busLabel.x), top: percent(busLabel.y) }}
      >
        {edge.bus}
      </span>

      <NodeCard layout={layout} id="client">
        <NodeName>{edge.client}</NodeName>
      </NodeCard>

      <NodeCard layout={layout} id="gateway">
        <div className="flex items-center gap-2.5">
          <NodeName>{edge.gateway}</NodeName>
          <span className="rounded-[3px] border border-signal px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-[0.12em] text-signal-ink">
            {GATEWAY_TAG}
          </span>
        </div>
      </NodeCard>

      <NodeCard layout={layout} id="orchestrator">
        <NodeName>{edge.orchestrator}</NodeName>
        <Caption>{ORCHESTRATOR_CAPTION}</Caption>
      </NodeCard>

      {steps.map((step, index) => {
        const status = frame.statuses[index];
        return (
          <NodeCard key={step.service} layout={layout} id={serviceNode(index)} failed={status === "failed"}>
            <div className="flex items-center gap-2">
              <StatusLight status={status} />
              <NodeName>{step.service}</NodeName>
            </div>
            <Caption>{SERVICE_CAPTION}</Caption>
            <span className="sr-only">{STATUS_WORDS[status]}</span>
          </NodeCard>
        );
      })}

      <div
        ref={tokenRef}
        aria-hidden
        data-tone="forward"
        className="pointer-events-none absolute z-20 size-2.5 bg-ink opacity-0 data-[tone=compensation]:bg-signal"
        style={{ transform: "translate(-50%, -50%)" }}
      />
    </div>
  );
}
