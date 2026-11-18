import type { SessionCopy } from "@/content";
import { assertNever } from "@/laptop";
import type { SessionCue } from "./stream";

/** Turns the session's cues into the sentences the live region reads out. */
export class SessionAnnouncer {
  public constructor(private readonly copy: Pick<SessionCopy, "announcements" | "runs">) {}

  public say(cue: SessionCue): string {
    const lines = this.copy.announcements;
    switch (cue.kind) {
      case "started":
        return lines.started.replaceAll("{prompt}", this.copy.runs[cue.prompt].chip);
      case "failed":
        return lines.failed;
      case "passed":
        return lines.passed;
      case "resolved":
        return lines.resolved;
      case "opened":
        return lines.opened;
      default:
        return assertNever(cue);
    }
  }
}
