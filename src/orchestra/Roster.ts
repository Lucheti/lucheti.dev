import type { Department, DepartmentId, OrchestraStep } from "@/content";

/** One line of a department card: an agent, or one parallel instance of it. */
export type RosterRow = Readonly<{
  /** Stable across renders, unique within the department, e.g. "engineer#2". */
  id: string;
  agent: string;
  /** 1-based instance number. */
  instance: number;
  /** How many instances of this agent the lifecycle ever runs at once. */
  instances: number;
}>;

/**
 * The fixed rows of every department card.
 *
 * Rows never appear or disappear while scrolling (the board would reflow and
 * the packet anchors would move), so each agent gets as many rows as the most
 * instances any single step runs in parallel, decided once up front.
 */
export class Roster {
  /** The id of the line for work done by code, on departments that have such a step. */
  public static readonly CODE_ROW = "code";

  private constructor(
    private readonly departments: ReadonlyMap<DepartmentId, Department>,
    private readonly rows: ReadonlyMap<DepartmentId, readonly RosterRow[]>,
    private readonly automated: ReadonlySet<DepartmentId>,
  ) {}

  /** Throws when a step names a department or agent that is not on the roster. */
  public static of(departments: readonly Department[], steps: readonly OrchestraStep[]): Roster {
    const byId = new Map(departments.map((department) => [department.id, department] as const));
    steps.forEach((step, index) => {
      const department = byId.get(step.department);
      if (department === undefined) {
        throw new RangeError(`Step ${index} names an unknown department "${step.department}"`);
      }
      step.workers.forEach((worker) => {
        if (!department.agents.includes(worker)) {
          throw new RangeError(`Step ${index}: "${worker}" is not on the ${department.name} roster`);
        }
      });
    });

    const rows = new Map(
      departments.map((department) => [department.id, Roster.rowsFor(department, steps)] as const),
    );
    const automated = new Set(steps.filter((step) => step.workers.length === 0).map((step) => step.department));
    return new Roster(byId, rows, automated);
  }

  private static rowsFor(department: Department, steps: readonly OrchestraStep[]): readonly RosterRow[] {
    const ownSteps = steps.filter((step) => step.department === department.id);
    return department.agents.flatMap((agent) => {
      const instances = Math.max(1, ...ownSteps.map((step) => Roster.countOf(agent, step.workers)));
      return Array.from({ length: instances }, (_, index) => ({
        id: `${agent}#${index + 1}`,
        agent,
        instance: index + 1,
        instances,
      }));
    });
  }

  private static countOf(agent: string, workers: readonly string[]): number {
    return workers.filter((worker) => worker === agent).length;
  }

  public departmentIds(): readonly DepartmentId[] {
    return [...this.departments.keys()];
  }

  public nameOf(department: DepartmentId): string {
    return this.departmentOf(department).name;
  }

  public rowsOf(department: DepartmentId): readonly RosterRow[] {
    return this.rows.get(department) ?? [];
  }

  /** Whether some step in this department is done by code rather than an agent. */
  public hasAutomatedStep(department: DepartmentId): boolean {
    return this.automated.has(department);
  }

  /** The row ids busy during `step`; repeated names fill instances 1, 2, 3 … */
  public busyRows(step: OrchestraStep): readonly string[] {
    const seen = new Map<string, number>();
    return step.workers.map((worker) => {
      const instance = (seen.get(worker) ?? 0) + 1;
      seen.set(worker, instance);
      return `${worker}#${instance}`;
    });
  }

  /**
   * A row index unique across the whole board, so each row can get its own
   * rhythm. A department's code row (`CODE_ROW`) comes after its agents.
   */
  public boardIndexOf(department: DepartmentId, rowId: string): number {
    let offset = 0;
    for (const id of this.departments.keys()) {
      const rows = this.rowsOf(id);
      if (id === department) {
        const index = rows.findIndex((row) => row.id === rowId);
        return offset + (index >= 0 ? index : rows.length);
      }
      offset += rows.length + (this.automated.has(id) ? 1 : 0);
    }
    return offset;
  }

  private departmentOf(id: DepartmentId): Department {
    const department = this.departments.get(id);
    if (department === undefined) {
      throw new RangeError(`Unknown department "${id}"`);
    }
    return department;
  }
}
