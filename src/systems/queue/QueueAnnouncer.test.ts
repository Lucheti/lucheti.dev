import { describe, expect, it } from "vitest";
import { QueueAnnouncer } from "./QueueAnnouncer";

const announcer = new QueueAnnouncer(
  {
    down: "{service} went down; {count} messages went back to the queue.",
    restarting: "{service} is restarting.",
    recovered: "{service} is back.",
    settled: "All caught up.",
  },
  ["Orders", "Payments"],
);

describe("QueueAnnouncer", () => {
  it("says nothing for a quiet frame", () => {
    expect(announcer.describe([])).toBeNull();
  });

  it("names the service and the messages handed back", () => {
    expect(announcer.describe([{ kind: "down", service: 1, returned: 4 }])).toBe(
      "Payments went down; 4 messages went back to the queue.",
    );
  });

  it("joins a frame's events in order", () => {
    expect(
      announcer.describe([
        { kind: "recovered", service: 0 },
        { kind: "settled" },
      ]),
    ).toBe("Orders is back. All caught up.");
  });
});
