import type { LabelHue, Laptop } from "@/content";
import { initialsOf } from "@/ui";
import { assertNever } from "../layers/assertNever";

/** A person as an avatar draws them. */
export type Person = Readonly<{ name: string; initials: string; colour: string }>;

/** A project as the sidebar draws it. */
export type Project = Readonly<{ id: string; name: string; colour: string }>;

/** A label as its pill draws it. */
export type Label = Readonly<{ name: string; colour: string }>;

/** The owner's avatar wears the signal orange; everyone else a colour of their own, in turn. */
const OWNER_COLOUR = "#ff5a1f";
const PEOPLE_COLOURS = ["#7c5cd6", "#14967f", "#3e63dd", "#d6409f", "#a8754f", "#0b8bb5"] as const;
const PROJECT_COLOURS = ["#8e4ec6", "#ff5a1f", "#2f9e64", "#3e63dd"] as const;

/** A label's dot colour. */
function colourOf(hue: LabelHue): string {
  switch (hue) {
    case "red":
      return "#e5484d";
    case "violet":
      return "#8e4ec6";
    case "amber":
      return "#e5a13a";
    case "blue":
      return "#3e63dd";
    case "green":
      return "#2f9e64";
    default:
      return assertNever(hue);
  }
}

/**
 * The people, projects and labels the tasks refer to by id, with the colours the screen draws them in.
 * Built once from the content; it refuses a task that names someone or something it does not know.
 */
export class Roster {
  private readonly people: ReadonlyMap<string, Person>;
  private readonly projectsById: ReadonlyMap<string, Project>;
  private readonly labels: ReadonlyMap<string, Label>;
  private readonly projectList: readonly Project[];

  public constructor(content: Laptop) {
    let others = 0;
    this.people = new Map(
      content.people.map((person) => {
        const colour = person.id === content.me ? OWNER_COLOUR : PEOPLE_COLOURS[others++ % PEOPLE_COLOURS.length];
        return [person.id, { name: person.name, initials: initialsOf(person.name).slice(0, 2), colour }];
      }),
    );
    this.projectList = content.projects.map((project, index) => ({ ...project, colour: PROJECT_COLOURS[index % PROJECT_COLOURS.length] }));
    this.projectsById = new Map(this.projectList.map((project) => [project.id, project]));
    this.labels = new Map(content.labels.map((label) => [label.id, { name: label.name, colour: colourOf(label.hue) }]));
    if (!this.people.has(content.me)) {
      throw new Error(`The laptop's owner is not among its people: ${content.me}`);
    }
    for (const task of [...content.tasks, ...content.incoming]) {
      if (!this.people.has(task.owner) || !this.projectsById.has(task.project) || !this.labels.has(task.label)) {
        throw new Error(`Task "${task.id}" names an unknown owner, project or label`);
      }
    }
  }

  public person(id: string): Person {
    return this.people.get(id) as Person;
  }

  public project(id: string): Project {
    return this.projectsById.get(id) as Project;
  }

  public label(id: string): Label {
    return this.labels.get(id) as Label;
  }

  /** Every project, in the sidebar's order. */
  public projects(): readonly Project[] {
    return this.projectList;
  }
}
