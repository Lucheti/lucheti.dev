import type { ReactNode } from "react";
import type { LabProject } from "@/content";
import { BulletList } from "@/ui";
import { PipelineDiagram } from "./PipelineDiagram";

export function FeaturedProjectCard({ project }: { readonly project: LabProject }): ReactNode {
  return (
    <article className="flex flex-col gap-10 rounded-2xl border border-line bg-ink-glass p-7 backdrop-blur-md md:p-10">
      <div className="flex flex-col gap-4">
        <h3 className="font-display text-5xl font-semibold leading-none tracking-[-0.04em] text-bone md:text-6xl">
          {project.name}
        </h3>
        <p className="text-xl leading-[1.4] text-bone">{project.tagline}</p>
        <p className="max-w-[34rem] leading-[1.6] text-bone-dim">{project.description}</p>
      </div>
      <div className="rounded-xl border border-line px-4 py-8 md:px-8 md:py-10">
        <PipelineDiagram />
      </div>
      <BulletList items={project.highlights} />
    </article>
  );
}
