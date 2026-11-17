"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { Component, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { LayersPanel as LayersContent } from "@/content";
import { cx, FeaturePanel, usePanelLoop } from "@/ui";
import { LAYER_ORDER } from "./layers/CardBlueprint";
import { composeLayersToy } from "./layers/composeLayersToy";
import type { Vec2 } from "./layers/IsometricView";
import type { StageSize } from "./layers/StageFit";
import { StackSketch } from "./layers/StackSketch";
import { useStageSize } from "./layers/useStageSize";

// WebGL has no server render; three.js and the scene are fetched only in the browser.
const LayersScene = dynamic(() => import("./layers/LayersScene"), { ssr: false });

/** The size the fallback drawing is laid out for before the stage has been measured; it scales to fit. */
const UNMEASURED: StageSize = { width: 640, height: 320 };

/** Where the WebGL scene stands: loading behind the fallback, drawing, or given up on. */
type SceneStatus = "loading" | "ready" | "failed";

type BoundaryProps = Readonly<{ onError: () => void; children: ReactNode }>;

/** Catches a WebGL context that cannot be made, so the panel keeps its fallback drawing instead of breaking. */
class SceneBoundary extends Component<BoundaryProps, Readonly<{ failed: boolean }>> {
  public state = { failed: false };

  public static getDerivedStateFromError(): Readonly<{ failed: boolean }> {
    return { failed: true };
  }

  public componentDidCatch(): void {
    this.props.onError();
  }

  public render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The front end's feature panel, "Layers": an isometric, exploded view of one card of UI. Its five layers
 * breathe from a tight stack to a wide one and back while the model sways, labels showing beside each layer
 * when apart; hovering leans it toward the pointer. A flat SVG drawing of the same stack shows until WebGL is
 * ready, and stays if it never is. Under reduced motion it holds the exploded frame.
 *
 * The composition root of the toy: the blueprint, choreography, camera and labels are made here, once.
 */
export function LayersPanel({ panel }: Readonly<{ panel: LayersContent }>): ReactNode {
  const stageRef = useRef<HTMLDivElement>(null);
  const running = usePanelLoop(stageRef);
  const still = useReducedMotion() === true;
  const [toy] = useState(composeLayersToy);
  const [status, setStatus] = useState<SceneStatus>("loading");
  const size = useStageSize(stageRef);

  const sketchSize = size ?? UNMEASURED;
  const sketch = useMemo(() => toy.sketch.draw(toy.stage.fit(sketchSize)), [toy, sketchSize]);

  // Until the scene draws, the labels are pinned where the fallback's still frame puts them.
  useLayoutEffect(() => {
    if (size === null || status === "ready") {
      return;
    }
    const fit = toy.stage.fit(size);
    const time = toy.choreography.stillMs();
    const point: Vec2 = { x: 0, y: 0 };
    LAYER_ORDER.forEach((_, layer) => {
      toy.stage.labelPoint(layer, time, 0, 0, fit, point);
      toy.labels.place(layer, point.x, point.y, fit.column(), 1);
    });
  }, [size, status, toy]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === "touch" || still) {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    toy.tilt.aim(event.clientX - box.left, event.clientY - box.top, box.width, box.height);
  };

  const ready = status === "ready";

  return (
    <FeaturePanel label={panel.label} title={panel.title}>
      <div
        ref={stageRef}
        aria-hidden
        onPointerMove={onPointerMove}
        onPointerLeave={() => toy.tilt.release()}
        className="relative min-h-[15rem] min-w-0 flex-1 select-none overflow-hidden sm:min-h-[18rem] lg:min-h-[20rem]"
      >
        <StackSketch
          shapes={sketch}
          size={sketchSize}
          className={cx(
            "absolute inset-0 size-full transition-opacity duration-700 ease-out-expo motion-reduce:transition-none",
            ready ? "opacity-0" : "opacity-100",
          )}
        />
        {status === "failed" ? null : (
          <div
            className={cx(
              "absolute inset-0 transition-opacity duration-700 ease-out-expo motion-reduce:transition-none",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            <SceneBoundary onError={() => setStatus("failed")}>
              <LayersScene
                toy={toy}
                running={running}
                still={still}
                onReady={() => setStatus("ready")}
                onLost={() => setStatus("failed")}
              />
            </SceneBoundary>
          </div>
        )}
        {LAYER_ORDER.map((kind, layer) => (
          <div
            key={kind}
            ref={(element) => toy.labels.attachRoot(layer, element)}
            className="pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform"
          >
            <span ref={(element) => toy.labels.attachLeader(layer, element)} className="absolute right-full top-0 h-px bg-ink/25">
              <span className="absolute -left-0.5 -top-0.5 size-[5px] rounded-full bg-ink" />
            </span>
            <span className="absolute left-2 top-[-8px] whitespace-nowrap text-[12px] font-medium leading-4 tracking-[-0.005em] text-ink">
              {panel.layers[kind]}
            </span>
          </div>
        ))}
      </div>
    </FeaturePanel>
  );
}
