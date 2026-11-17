import { describe, expect, it } from "vitest";
import { ORCHESTRA_PAGE, SITE, type Domain } from "@/content";
import { toolIcon } from "./toolIcons";

/**
 * Tools that render as text on purpose: Simple Icons has no official mark for
 * them, or they are concepts rather than products. A tool in the content that
 * is neither here nor in the registry is a typo or a missing icon.
 */
const ICONLESS = new Set([
  // Front end
  "Zustand",
  "WCAG 2.2 AA",
  "WAI-ARIA",
  "Motion",
  "Lenis",
  "MediaBunny",
  "WebCodecs",
  "Web Workers",
  // Back end
  "WebSockets",
  "Saga orchestration",
  "opossum",
  "Winston",
  "BullMQ",
  "AWS ECS Fargate",
  // AI and tooling
  "plugins & hooks",
  "sub-agents",
  "Agent Teams",
  "model inference APIs",
  "BuilderBot",
  "Baileys",
  "Higgsfield",
  "Nano Banana Pro",
  "Runway API",
  "tool use",
  "streaming",
  "agents",
  "hooks",
  "skills",
  "workflows",
  "monitors",
  "Beads",
  "launchd",
]);

function toolsOf(domain: Domain): readonly string[] {
  return [...domain.areas.flatMap((area) => area.tools), ...domain.repos.flatMap((repo) => repo.tools)];
}

const USED = new Set([
  ...toolsOf(SITE.craft),
  ...toolsOf(SITE.systems),
  ...toolsOf(SITE.ai),
  ...ORCHESTRA_PAGE.builtWith.tools,
]);

describe("tool icons", () => {
  it("resolves every tool in the content to an icon, or lists it as icon-less", () => {
    const unknown = [...USED].filter((tool) => toolIcon(tool) === undefined && !ICONLESS.has(tool));
    expect(unknown).toEqual([]);
  });

  it("never lists a tool as icon-less when it has an icon", () => {
    const both = [...ICONLESS].filter((tool) => toolIcon(tool) !== undefined);
    expect(both).toEqual([]);
  });

  it("keeps the icon-less list free of tools the content no longer uses", () => {
    const stale = [...ICONLESS].filter((tool) => !USED.has(tool));
    expect(stale).toEqual([]);
  });

  it("gives every icon a drawable path", () => {
    const blank = [...USED].filter((tool) => toolIcon(tool)?.path === "");
    expect(blank).toEqual([]);
  });
});
