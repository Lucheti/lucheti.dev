/** The menu bar clock's two halves: the date, and the time with its separator. */
export type ClockFace = Readonly<{ date: string; hours: string; minutes: string; period: string }>;

/**
 * The menu bar clock, written the way macOS writes it in US English: "Tue Nov 17", then "9:41 AM". The
 * panel draws the separator itself so it can flash each second.
 */
export class MenuClock {
  private readonly format: Intl.DateTimeFormat;

  /** `timeZone` is an IANA zone; leave it out for the visitor's own. */
  public constructor(timeZone?: string) {
    this.format = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    });
  }

  /** The clock face at `date`. */
  public read(date: Date): ClockFace {
    const parts = new Map(this.format.formatToParts(date).map((part) => [part.type, part.value]));
    const part = (type: Intl.DateTimeFormatPartTypes): string => parts.get(type) ?? "";
    return {
      date: `${part("weekday")} ${part("month")} ${part("day")}`,
      hours: part("hour"),
      minutes: part("minute"),
      period: part("dayPeriod").toUpperCase(),
    };
  }
}
