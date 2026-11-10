import type { ReactNode } from "react";
import type { LabProject } from "@/content";
import { BulletList } from "@/ui";

export function ProjectCard({ project }: { readonly project: LabProject }): ReactNode {
  return (
    <article className="flex h-full flex-col gap-5 rounded-2xl border border-line bg-ink-glass p-7 backdrop-blur-md transition-colors duration-500 ease-out-expo hover:border-line-strong">
      <h3 className="font-display text-3xl font-semibold leading-none tracking-[-0.035em] text-bone">
        {project.name}
      </h3>
      <p className="text-lg leading-[1.4] text-bone">{project.tagline}</p>
      <p className="text-[15px] leading-[1.6] text-bone-dim">{project.description}</p>
      <BulletList items={project.highlights} />
    </article>
  );
}
