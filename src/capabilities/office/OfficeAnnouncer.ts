import { assertNever } from "./assertNever";
import type { OfficeEvent, TicketName } from "./types";

/** Sentence templates; `{ticket}` is filled in with the ticket's id and title. */
export type OfficeAnnouncements = Readonly<{ dropped: string; full: string; bounced: string; shipped: string }>;

/** Turns the office's events into sentences for a polite live region. */
export class OfficeAnnouncer {
  public constructor(private readonly templates: OfficeAnnouncements) {}

  /** One sentence for a batch of events, or null when there is none. */
  public describe(events: readonly OfficeEvent[]): string | null {
    const sentences = events.map((event) => this.sentence(event));
    return sentences.length > 0 ? sentences.join(" ") : null;
  }

  private sentence(event: OfficeEvent): string {
    switch (event.kind) {
      case "dropped":
        return this.templates.dropped;
      case "full":
        return this.templates.full;
      case "bounced":
        return this.fill(this.templates.bounced, event.name);
      case "shipped":
        return this.fill(this.templates.shipped, event.name);
      default:
        return assertNever(event);
    }
  }

  private fill(template: string, name: TicketName): string {
    return template.replace("{ticket}", `${name.id} ${name.title}`);
  }
}
