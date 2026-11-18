import { describe, expect, it } from "vitest";
import { SITE } from "@/content";
import { SeededRandom } from "../agent/SeededRandom";
import { AgentSession } from "./AgentSession";
import { sessionPace } from "./pace";
import { RunWriter } from "./RunWriter";
import { SeededFailures, type FailureDraw } from "./SeededFailures";
import { SessionAnnouncer } from "./SessionAnnouncer";
import { SessionRunner } from "./SessionRunner";

const copy = SITE.ai.session;
const writer = new RunWriter(copy.runs, sessionPace());

/** Fails the runs it is told to, by number from 1. */
class Scripted implements FailureDraw {
  private count = 0;

  public constructor(private readonly failing: readonly number[]) {}

  public next(): boolean {
    this.count += 1;
    return this.failing.includes(this.count);
  }
}

describe("AgentSession", () => {
  it("is idle with an empty stream before its first run", () => {
    const session = new AgentSession(writer, new Scripted([]));
    expect(session.view()).toMatchObject({ prompt: null, status: "idle", rows: [] });
    expect(session.runCount()).toBe(0);
  });

  it("streams a run in as time passes, then is done", () => {
    const session = new AgentSession(writer, new Scripted([]));
    session.start("dark-mode", "ghost");
    expect(session.view()).toMatchObject({ prompt: "dark-mode", run: 1, status: "running", rows: [] });
    session.advance(1000);
    expect(session.view().rows.map((row) => row.kind)).toEqual(["request"]);
    session.advance(60_000);
    expect(session.view().status).toBe("done");
    expect(session.view().rows.at(-1)?.kind).toBe("pr");
  });

  it("clears the stream when a new run starts, and counts the runs", () => {
    const session = new AgentSession(writer, new Scripted([]));
    session.show("dark-mode", "ghost");
    session.start("tests", "visitor");
    expect(session.view()).toMatchObject({ prompt: "tests", run: 2, status: "running", rows: [] });
    expect(session.runCount()).toBe(2);
  });

  it("shows a finished run at once, fixed after a failure when the draw says so", () => {
    const session = new AgentSession(writer, new Scripted([1]));
    session.show("slow-page", "visitor");
    const tests = session.view().rows.filter((row) => row.kind === "tool" && row.call.tool === "run_tests");
    expect(tests.map((row) => row.kind === "tool" && row.call.tool === "run_tests" && row.call.outcome.kind)).toEqual(["fail", "pass"]);
    expect(session.view().status).toBe("done");
  });

  it("announces the start, the failure, the pass, the review and the pull request", () => {
    const session = new AgentSession(writer, new Scripted([1]));
    session.start("tests", "ghost");
    session.advance(60_000);
    expect(session.takeCues().map((cue) => cue.kind)).toEqual(["started", "failed", "passed", "resolved", "opened"]);
    expect(session.takeCues()).toEqual([]);
  });

  it("keeps the same view object while nothing on screen changes", () => {
    const session = new AgentSession(writer, new Scripted([]));
    session.show("dark-mode", "ghost");
    const before = session.view();
    session.advance(5000);
    expect(session.view()).toBe(before);
  });

  it("knows while the visitor's own run is on screen, and for a grace after it ends", () => {
    const session = new AgentSession(writer, new Scripted([]));
    session.show("dark-mode", "ghost");
    expect(session.visitorWatching(6000)).toBe(false);
    session.start("tests", "visitor");
    expect(session.visitorWatching(6000)).toBe(true);
    session.advance(writer.scriptFor("tests", false).duration() + 5000);
    expect(session.visitorWatching(6000)).toBe(true);
    session.advance(1000);
    expect(session.visitorWatching(6000)).toBe(false);
  });
});

describe("SeededFailures", () => {
  it("fails about one run in three, the same runs every time", () => {
    const draw = (): boolean[] => {
      const failures = new SeededFailures(new SeededRandom(20_261_238), 1 / 3);
      return Array.from({ length: 300 }, () => failures.next());
    };
    const runs = draw();
    expect(runs).toEqual(draw());
    const failed = runs.filter(Boolean).length;
    expect(failed).toBeGreaterThan(80);
    expect(failed).toBeLessThan(120);
  });

  it("opens on a failing run, then a passing one, then a failing one", () => {
    const failures = new SeededFailures(new SeededRandom(20_261_238), 1 / 3);
    expect([failures.next(), failures.next(), failures.next()]).toEqual([true, false, true]);
  });

  it("refuses a rate outside 0 to 1", () => {
    const random = new SeededRandom(1);
    expect(() => new SeededFailures(random, 0)).toThrow();
    expect(() => new SeededFailures(random, 1)).toThrow();
  });
});

describe("SessionRunner", () => {
  it("publishes a new snapshot when the view changes and passes the cues on", () => {
    const runner = new SessionRunner(new AgentSession(writer, new Scripted([])));
    let changes = 0;
    const heard: string[] = [];
    runner.subscribe(() => {
      changes += 1;
    });
    runner.listen((cues) => heard.push(...cues.map((cue) => cue.kind)));
    runner.start("dark-mode", "visitor");
    expect(changes).toBe(1);
    expect(heard).toEqual(["started"]);
    runner.frame(0, 0);
    expect(changes).toBe(1);
    runner.frame(16, 1000);
    expect(changes).toBe(2);
    expect(runner.snapshot().rows).toHaveLength(1);
  });

  it("shows a finished run for reduced motion, announcing what happened", () => {
    const runner = new SessionRunner(new AgentSession(writer, new Scripted([])));
    const heard: string[] = [];
    runner.listen((cues) => heard.push(...cues.map((cue) => cue.kind)));
    runner.show("tests");
    expect(runner.snapshot().status).toBe("done");
    expect(heard).toEqual(["started", "passed", "resolved", "opened"]);
  });
});

describe("SessionAnnouncer", () => {
  const announcer = new SessionAnnouncer(copy);

  it("names the prompt a run started with", () => {
    expect(announcer.say({ kind: "started", prompt: "slow-page" })).toBe("Started: Fix the slow page.");
  });

  it("says the key moments in plain words", () => {
    expect(announcer.say({ kind: "failed" })).toBe("Tests failed, fixing.");
    expect(announcer.say({ kind: "passed" })).toBe("Tests pass.");
    expect(announcer.say({ kind: "opened" })).toBe("Pull request opened.");
  });
});
