import type { Office } from "../office";
import type { Trigger } from "./kit";

/** What the office's big button sets off: a new idea dropped into Product's inbox. */
export class DropIdea implements Trigger {
  public constructor(private readonly office: Office) {}

  public fire(): void {
    this.office.drop();
  }
}
