import type { AgentTicket } from "@/content";

/** A ticket for tests, with every call told apart by its text. */
export function ticketFixture(id: string): AgentTicket {
  return {
    id,
    title: `title ${id}`,
    read: { call: `read ${id}` },
    search: { call: `search ${id}` },
    code: { call: `edit ${id}` },
    test: { call: `test ${id}`, result: "9 passed" },
    failure: { call: `test ${id}`, result: "1 failed" },
    fix: { call: `fix ${id}` },
  };
}
