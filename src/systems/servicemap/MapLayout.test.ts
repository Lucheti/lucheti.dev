import { describe, expect, it } from "vitest";
import { MapLayout, travel, type PointBuffer, type Rect } from "./MapLayout";
import { EdgeBook, type NodeId } from "./topology";

const book = new EdgeBook();
const layout = new MapLayout(book);

const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("MapLayout", () => {
  it("fits every card on the canvas without overlaps", () => {
    const ids: readonly NodeId[] = ["clients", "gateway", "orders", "payments", "inventory", "postgres", "nats", "redis"];
    const { width, height } = layout.size();
    for (const id of ids) {
      const box = layout.node(id);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
      for (const other of ids) {
        if (other !== id) {
          expect(overlaps(box, layout.node(other))).toBe(false);
        }
      }
    }
  });

  it("puts the gateway level with the middle service, and each store level with its row", () => {
    expect(layout.node("gateway").y).toBe(layout.node("payments").y);
    expect(layout.node("postgres").y).toBe(layout.node("orders").y);
    expect(layout.node("redis").y).toBe(layout.node("inventory").y);
  });

  it("runs each edge from one card's side to the next card's side", () => {
    const point: PointBuffer = { x: 0, y: 0 };
    const gateway = layout.node("gateway");
    const orders = layout.node("orders");
    layout.place(book.route("orders"), 0, point);
    expect(point).toEqual({ x: gateway.x + gateway.width, y: gateway.y + gateway.height / 2 });
    layout.place(book.route("orders"), 1, point);
    expect(point).toEqual({ x: orders.x, y: orders.y + orders.height / 2 });
  });

  it("drops straight down from the clients to the gateway", () => {
    const point: PointBuffer = { x: 0, y: 0 };
    const clients = layout.node("clients");
    layout.place(book.entry(), 0.5, point);
    expect(point.x).toBe(clients.x + clients.width / 2);
    expect(point.y).toBeGreaterThan(clients.y + clients.height);
    expect(point.y).toBeLessThan(layout.node("gateway").y);
  });

  it("sets an edge's midpoint halfway between its cards, and writes its path", () => {
    const middle = layout.midpoint(book.route("payments"));
    const gateway = layout.node("gateway");
    expect(middle.x).toBeCloseTo((gateway.x + gateway.width + layout.node("payments").x) / 2, 5);
    expect(layout.path(book.entry())).toMatch(/^M[\d.]+ [\d.]+ C/);
  });

  it("refuses an edge it does not know", () => {
    expect(() => layout.path({ kind: "entry" })).toThrow();
  });
});

describe("travel", () => {
  it("runs from 0 to 1, rising all the way", () => {
    expect(travel(0)).toBe(0);
    expect(travel(1)).toBe(1);
    expect(travel(0.5)).toBeCloseTo(0.5, 5);
    expect(travel(0.3)).toBeLessThan(travel(0.31));
    expect(travel(2)).toBe(1);
  });
});
