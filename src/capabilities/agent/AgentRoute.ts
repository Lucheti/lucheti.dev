import type { AgentStationId, AgentTicket, AgentToolCall } from "@/content";

/** The four stations where the agent calls a tool. */
export type ToolStation = Extract<AgentStationId, "read" | "search" | "code" | "test">;

/** How a tool call ends: plain work, a test run that passes or fails, or the edit that fixes a failure. */
export type WorkOutcome = "done" | "passed" | "failed" | "fixed";

/** One beat of a ticket's round, before it is given a length. */
export type RouteStep =
  | Readonly<{ kind: "pickup" }>
  | Readonly<{ kind: "walk"; from: AgentStationId; to: AgentStationId }>
  | Readonly<{ kind: "work"; at: ToolStation; call: AgentToolCall; outcome: WorkOutcome }>
  | Readonly<{ kind: "shake"; call: AgentToolCall }>
  | Readonly<{ kind: "ship" }>;

/**
 * The beats of one ticket's round: pick it up at the inbox, read, search, code and test, ship it, and
 * walk back. On a retry the first test run fails; the agent shakes its head, walks back to Code, fixes
 * it, and the second run passes.
 */
export class AgentRoute {
  private readonly route: readonly RouteStep[];

  public constructor(ticket: AgentTicket, retry: boolean) {
    const firstTry: readonly RouteStep[] = [
      { kind: "pickup" },
      { kind: "walk", from: "inbox", to: "read" },
      { kind: "work", at: "read", call: ticket.read, outcome: "done" },
      { kind: "walk", from: "read", to: "search" },
      { kind: "work", at: "search", call: ticket.search, outcome: "done" },
      { kind: "walk", from: "search", to: "code" },
      { kind: "work", at: "code", call: ticket.code, outcome: "done" },
      { kind: "walk", from: "code", to: "test" },
    ];
    const comeback: readonly RouteStep[] = retry
      ? [
          { kind: "work", at: "test", call: ticket.failure, outcome: "failed" },
          { kind: "shake", call: ticket.failure },
          { kind: "walk", from: "test", to: "code" },
          { kind: "work", at: "code", call: ticket.fix, outcome: "fixed" },
          { kind: "walk", from: "code", to: "test" },
        ]
      : [];
    const finish: readonly RouteStep[] = [
      { kind: "work", at: "test", call: ticket.test, outcome: "passed" },
      { kind: "walk", from: "test", to: "ship" },
      { kind: "ship" },
      { kind: "walk", from: "ship", to: "inbox" },
    ];
    this.route = [...firstTry, ...comeback, ...finish];
  }

  /** The beats, in order. */
  public steps(): readonly RouteStep[] {
    return this.route;
  }
}
