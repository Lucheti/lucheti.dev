"use client";

import { useEffect, useRef, type PointerEvent, type RefObject } from "react";
import type { HoverTilt } from "@/craft/layers/HoverTilt";
import { assertNever } from "@/craft/layers/assertNever";
import type { DioramaBehaviour } from "./DioramaMode";
import type { DragGesture } from "./DragGesture";
import type { PointerCursor } from "./PointerCursor";
import type { Waker } from "./Switchboard";
import type { TurnSpring } from "./TurnSpring";

/** The parts an island's box hands the pointer to. */
export type PointerParts = Readonly<{
  cursor: PointerCursor;
  gesture: DragGesture;
  turn: TurnSpring;
  lean: HoverTilt;
  waker: Waker;
}>;

/** The box's ref and the pointer handlers to spread on it. */
export type IslandPointer = Readonly<{
  boxRef: RefObject<HTMLDivElement | null>;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: () => void;
}>;

/**
 * The pointer over an island's box: the island leans toward a hovering mouse, a press and a drag past the
 * threshold turns it (with the grab cursor), and letting go springs it back. Touch never drags, so the
 * page scrolls under a finger.
 */
export function useIslandPointer(parts: PointerParts, behaviour: DioramaBehaviour): IslandPointer {
  const boxRef = useRef<HTMLDivElement>(null);
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
          waker.wake();
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

  return { boxRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onPointerLeave: () => lean.release() };
}
