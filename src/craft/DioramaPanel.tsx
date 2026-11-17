"use client";

import dynamic from "next/dynamic";
import { useInView, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import type { Diorama, DioramaControls } from "@/content";
import { cx, SceneBoundary } from "@/ui";
import { composeDiorama } from "./diorama/composeDiorama";
import { DioramaFallback } from "./diorama/DioramaFallback";
import { behaviourOf, pickMode } from "./diorama/DioramaMode";
import type { DioramaView } from "./diorama/DioramaState";
import { assertNever } from "./layers/assertNever";
import { allTargets, targetKey, type Target } from "./diorama/Target";

// WebGL has no server render; three.js and the scene are fetched only in the browser.
const DioramaScene = dynamic(() => import("./diorama/DioramaScene"), { ssr: false });

/** Tablet width and up: where the island leans and drags. Matches Tailwind's `md`. */
const WIDE_QUERY = "(min-width: 768px)";

/** Where the WebGL scene stands: loading behind the fallback, drawing, or given up on. */
type SceneStatus = "loading" | "ready" | "failed";

function subscribeToWidth(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isWide = (): boolean => window.matchMedia(WIDE_QUERY).matches;

/** A hidden button's name. */
function labelOf(target: Target, controls: DioramaControls): string {
  switch (target.kind) {
    case "star":
      return controls.star.replace("{count}", String(target.count));
    case "toggle":
    case "button":
    case "slider":
    case "checkbox":
    case "lamp":
    case "duck":
    case "plant":
    case "card":
      return controls[target.kind];
    default:
      return assertNever(target);
  }
}

/** Whether a hidden button reads as pressed: the switches that stay on, and the star the task is rated at. */
function pressedOf(target: Target, view: DioramaView): boolean | undefined {
  switch (target.kind) {
    case "toggle":
      return view.theme === "dark";
    case "checkbox":
      return view.done;
    case "lamp":
      return view.lampOn;
    case "star":
      return view.rating === target.count;
    case "button":
    case "slider":
    case "duck":
    case "plant":
    case "card":
      return undefined;
    default:
      return assertNever(target);
  }
}

/**
 * The keyboard's way in: a list of buttons that mirror every clickable piece, with the same effects. Hidden
 * until one of them has focus; then they show under the island as a row of small pills.
 */
function ControlList({ controls, view, onPress }: Readonly<{ controls: DioramaControls; view: DioramaView; onPress: (target: Target) => void }>): ReactNode {
  return (
    <div role="group" aria-label={controls.label} className="sr-only focus-within:not-sr-only focus-within:mt-4 focus-within:flex focus-within:flex-wrap focus-within:gap-2">
      {allTargets().map((target) => (
        <button
          key={targetKey(target)}
          type="button"
          aria-pressed={pressedOf(target, view)}
          onClick={() => onPress(target)}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-inset ring-line aria-pressed:bg-signal aria-pressed:ring-signal"
        >
          {labelOf(target, controls)}
        </button>
      ))}
    </div>
  );
}

/**
 * The Front end chapter's diorama: a small cartoon room on a floating island beside the heading. It lives by
 * itself (steam, plants, a duck, a breathing UI card, tasks arriving on the screen), leans toward the pointer,
 * turns when dragged and springs back, and its pegboard's controls drive the app on the monitor. Phones get
 * taps but no drag; reduced motion holds it still and applies clicks at once. A flat drawing shows until
 * WebGL has drawn, and stays if it never does.
 */
export function DioramaPanel({ diorama: content }: Readonly<{ diorama: Diorama }>): ReactNode {
  const [parts] = useState(composeDiorama);
  const [status, setStatus] = useState<SceneStatus>("loading");
  const boxRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const running = useInView(boxRef, { margin: "10% 0px 10% 0px" });
  const wide = useSyncExternalStore(subscribeToWidth, isWide, () => true);
  const reduced = useReducedMotion() === true;
  const behaviour = useMemo(() => behaviourOf(pickMode(wide, reduced)), [wide, reduced]);
  const view = useSyncExternalStore(parts.state.subscribe, parts.state.snapshot, parts.state.snapshot);
  const { cursor, gesture, turn, lean, waker } = parts;

  useEffect(() => {
    cursor.attach(boxRef.current);
    return () => cursor.attach(null);
  }, [cursor]);
  useEffect(() => cursor.allowDrag(behaviour.drag), [cursor, behaviour]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (behaviour.drag && event.pointerType !== "touch" && event.button === 0) {
      gesture.down(event.clientX);
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const move = gesture.move(event.clientX);
    switch (move.kind) {
      case "hover":
        if (behaviour.parallax && event.pointerType !== "touch") {
          const box = event.currentTarget.getBoundingClientRect();
          lean.aim(event.clientX - box.left, event.clientY - box.top, box.width, box.height);
        }
        break;
      case "pending":
        break;
      case "start":
        event.currentTarget.setPointerCapture(event.pointerId);
        turn.grab();
        turn.drag(move.dx);
        cursor.grabbing(true);
        waker.wake();
        break;
      case "drag":
        turn.drag(move.dx);
        waker.wake();
        break;
      default:
        assertNever(move);
    }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (gesture.up()) {
      turn.release();
      cursor.grabbing(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      waker.wake();
    }
  };
  const onHover = useCallback((target: Target | null) => cursor.hovering(target !== null), [cursor]);

  const ready = status === "ready";

  return (
    <figure className="relative">
      <figcaption className="sr-only">{content.label}</figcaption>
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => lean.release()}
        className="relative aspect-square w-full touch-pan-y select-none"
      >
        <DioramaFallback
          sketch={parts.sketch}
          frame={parts.framing.bounds()}
          margin={parts.framing.margin()}
          className={cx("absolute inset-0 size-full transition-opacity duration-700 ease-out-expo motion-reduce:transition-none", ready ? "opacity-0" : "opacity-100")}
        />
        {status === "failed" ? null : (
          <div
            ref={hostRef}
            className={cx(
              "absolute inset-0 isolate transition-opacity duration-700 ease-out-expo motion-reduce:transition-none",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            <SceneBoundary onError={() => setStatus("failed")}>
              <DioramaScene
                parts={parts}
                screen={content.screen}
                behaviour={behaviour}
                host={hostRef}
                running={running}
                onReady={() => setStatus("ready")}
                onLost={() => setStatus("failed")}
                onHover={onHover}
              />
            </SceneBoundary>
          </div>
        )}
      </div>
      <ControlList controls={content.controls} view={view} onPress={(target) => parts.switchboard.press(target)} />
    </figure>
  );
}
