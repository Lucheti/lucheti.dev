import type { ServiceMapCopy } from "@/content";
import { assertNever } from "../queue/assertNever";
import type { MapEvent } from "./types";

/** Turns the map's events into the sentences the live region reads out. */
export class MapAnnouncer {
  public constructor(private readonly copy: Pick<ServiceMapCopy, "announcements" | "services">) {}

  public say(event: MapEvent): string {
    const lines = this.copy.announcements;
    switch (event.kind) {
      case "down":
        return this.fill(lines.down, event.service);
      case "opened":
        return this.fill(lines.opened, event.service);
      case "probing":
        return this.fill(lines.probing, event.service);
      case "back":
        return this.fill(lines.back, event.service);
      case "spike":
        return lines.spike;
      case "settled":
        return lines.settled;
      default:
        return assertNever(event);
    }
  }

  private fill(template: string, service: keyof ServiceMapCopy["services"]): string {
    return template.replaceAll("{service}", this.copy.services[service].name);
  }
}
