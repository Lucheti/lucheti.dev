import { describe, expect, it } from "vitest";
import { LabelPins } from "./LabelPins";
import { point, type Point3 } from "./space";

type PinKey = "kiosk" | "button" | "broker" | `sign-${number}`;

const element = (name: string): HTMLElement => ({ id: name }) as HTMLElement;

describe("LabelPins", () => {
  it("visits each bound label with its point, and forgets one that unmounts", () => {
    const pins = new LabelPins(
      new Map<PinKey, Point3>([
        ["kiosk", point(1, 2, 3)],
        ["sign-0", point(4, 5, 6)],
      ]),
    );
    pins.bind("kiosk")(element("kiosk"));
    pins.bind("sign-0")(element("sign"));
    const seen: string[] = [];
    pins.each((anchor, label) => seen.push(`${label.id}@${anchor.x}`));
    expect(seen).toEqual(["kiosk@1", "sign@4"]);

    pins.bind("sign-0")(null);
    seen.length = 0;
    pins.each((anchor, label) => seen.push(`${label.id}@${anchor.x}`));
    expect(seen).toEqual(["kiosk@1"]);
  });

  it("hands out one stable ref per label", () => {
    const pins = new LabelPins(new Map<PinKey, Point3>([["button", point(0, 0, 0)]]));
    expect(pins.bind("button")).toBe(pins.bind("button"));
  });

  it("refuses a label with no point", () => {
    expect(() => new LabelPins(new Map<PinKey, Point3>()).bind("broker")).toThrow();
  });
});
