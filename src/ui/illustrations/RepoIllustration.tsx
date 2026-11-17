import type { ReactNode } from "react";
import type { RepoIllustrationKind } from "@/content";
import { cx } from "../cx";
import { DepartmentsDrawing } from "./DepartmentsDrawing";
import { JobQueueDrawing } from "./JobQueueDrawing";
import { NodeGraphDrawing } from "./NodeGraphDrawing";
import { SagaDrawing } from "./SagaDrawing";
import { StoryboardDrawing } from "./StoryboardDrawing";
import { WebsiteDrawing } from "./WebsiteDrawing";

function assertNever(value: never): never {
  throw new Error(`Unhandled illustration: ${String(value)}`);
}

function drawingFor(kind: RepoIllustrationKind): ReactNode {
  switch (kind) {
    case "node-graph":
      return <NodeGraphDrawing />;
    case "website":
      return <WebsiteDrawing />;
    case "saga":
      return <SagaDrawing />;
    case "job-queue":
      return <JobQueueDrawing />;
    case "departments":
      return <DepartmentsDrawing />;
    case "storyboard":
      return <StoryboardDrawing />;
    default:
      return assertNever(kind);
  }
}

/** A repository's drawing in its spec-sheet frame. Decorative: the repository name is the accessible text. */
export function RepoIllustration({
  kind,
  spaced = true,
}: Readonly<{ kind: RepoIllustrationKind; /** Leave room under the frame; turn off when the parent lays out the gap. */ spaced?: boolean }>): ReactNode {
  return (
    <div
      aria-hidden
      className={cx("aspect-[16/9] w-full overflow-hidden rounded-md border border-line bg-paper-sunk bg-grid", spaced && "mb-6")}
    >
      {drawingFor(kind)}
    </div>
  );
}
