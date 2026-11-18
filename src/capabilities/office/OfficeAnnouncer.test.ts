import { describe, expect, it } from "vitest";
import { SITE } from "@/content";
import { OfficeAnnouncer } from "./OfficeAnnouncer";
import { QaVerdicts } from "./QaVerdicts";

const name = { id: "F-12", title: "dark mode" };

describe("OfficeAnnouncer", () => {
  it("says when a ticket is sent back or ships, naming it", () => {
    const announcer = new OfficeAnnouncer(SITE.ai.office.announcements);
    expect(announcer.describe([{ kind: "shipped", name }])).toBe("F-12 dark mode shipped.");
    expect(announcer.describe([{ kind: "bounced", name }])).toContain("F-12 dark mode");
    expect(announcer.describe([])).toBeNull();
  });
});

describe("QaVerdicts", () => {
  it("sends a ticket back when the draw falls under the chance", () => {
    const draws = [0.1, 0.5, 0.24, 0.9];
    let index = 0;
    const verdicts = new QaVerdicts({ next: () => draws[index++] }, 0.25);
    expect([verdicts.bounces(), verdicts.bounces(), verdicts.bounces(), verdicts.bounces()]).toEqual([1, 0, 1, 0]);
    expect(() => new QaVerdicts({ next: () => 0 }, 2)).toThrow();
  });
});
