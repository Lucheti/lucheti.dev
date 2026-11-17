import { assertNever } from "./assertNever";
import type { QueueEvent } from "./types";

/** Sentence templates; `{service}` and `{count}` are filled in. */
export type AnnouncementTemplates = Readonly<{
  down: string;
  restarting: string;
  recovered: string;
  settled: string;
}>;

/** Turns simulation events into sentences for a polite live region. */
export class QueueAnnouncer {
  public constructor(
    private readonly templates: AnnouncementTemplates,
    private readonly serviceNames: readonly string[],
  ) {}

  /** One sentence for a frame's events, or null when none is worth saying. */
  public describe(events: readonly QueueEvent[]): string | null {
    const sentences = events.map((event) => this.sentence(event));
    return sentences.length > 0 ? sentences.join(" ") : null;
  }

  private sentence(event: QueueEvent): string {
    switch (event.kind) {
      case "down":
        return this.fill(this.templates.down, event.service, event.returned);
      case "restarting":
        return this.fill(this.templates.restarting, event.service, 0);
      case "recovered":
        return this.fill(this.templates.recovered, event.service, 0);
      case "settled":
        return this.templates.settled;
      default:
        return assertNever(event);
    }
  }

  private fill(template: string, service: number, count: number): string {
    const name = this.serviceNames[service] ?? `Service ${service + 1}`;
    return template.replaceAll("{service}", name).replaceAll("{count}", String(count));
  }
}
