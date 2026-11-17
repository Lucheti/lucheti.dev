import { describe, expect, it } from "vitest";
import { DragGesture } from "./DragGesture";
import { PointerCursor } from "./PointerCursor";

describe("DragGesture", () => {
  it("is a hover with no button down", () => {
    expect(new DragGesture(5).move(10)).toEqual({ kind: "hover" });
  });

  it("stays a click until the pointer has moved far enough across, then drags", () => {
    const gesture = new DragGesture(5);
    gesture.down(100);
    expect(gesture.move(103)).toEqual({ kind: "pending" });
    expect(gesture.active()).toBe(false);
    expect(gesture.move(94)).toEqual({ kind: "start", dx: -6 });
    expect(gesture.move(140)).toEqual({ kind: "drag", dx: 40 });
    expect(gesture.active()).toBe(true);
    expect(gesture.up()).toBe(true);
    expect(gesture.move(150)).toEqual({ kind: "hover" });
  });

  it("tells a click from a drag when the button comes up", () => {
    const gesture = new DragGesture(5);
    gesture.down(100);
    gesture.move(102);
    expect(gesture.up()).toBe(false);
  });

  it("refuses a negative threshold", () => {
    expect(() => new DragGesture(-1)).toThrow();
  });
});

describe("PointerCursor", () => {
  it("shows a pointer over clickable things, a closed hand while dragging, an open hand otherwise when it drags", () => {
    const cursor = new PointerCursor();
    expect(cursor.cursor()).toBe("default");
    cursor.allowDrag(true);
    expect(cursor.cursor()).toBe("grab");
    cursor.hovering(true);
    expect(cursor.cursor()).toBe("pointer");
    cursor.grabbing(true);
    expect(cursor.cursor()).toBe("grabbing");
    cursor.grabbing(false);
    cursor.hovering(false);
    cursor.allowDrag(false);
    expect(cursor.cursor()).toBe("default");
  });
});
