/** Formats the wall-clock time of one IANA time zone as HH:MM (24 hours). */
export class ZonedClock {
  public static readonly PLACEHOLDER = "--:--";

  private readonly formatter: Intl.DateTimeFormat;

  public constructor(timeZone: string) {
    if (timeZone.trim() === "") {
      throw new Error("ZonedClock needs a time zone");
    }
    // Intl throws a RangeError for an unknown zone, so a bad zone fails at birth.
    this.formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  }

  public read(now: Date): string {
    return this.formatter.format(now);
  }
}
