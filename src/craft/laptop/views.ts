import { assertNever } from "../layers/assertNever";

/** What the task list shows: the owner's tasks, every open task, the finished ones, or one project's. */
export type View =
  | Readonly<{ kind: "mine" }>
  | Readonly<{ kind: "all" }>
  | Readonly<{ kind: "done" }>
  | Readonly<{ kind: "project"; project: string }>;

/** A view as a string, for keys, counts and comparisons. */
export type ViewKey = "mine" | "all" | "done" | `project:${string}`;

/** The view's key. */
export function viewKey(view: View): ViewKey {
  switch (view.kind) {
    case "mine":
    case "all":
    case "done":
      return view.kind;
    case "project":
      return `project:${view.project}`;
    default:
      return assertNever(view);
  }
}
