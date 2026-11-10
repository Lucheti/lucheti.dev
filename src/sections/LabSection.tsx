import type { ReactNode } from "react";
import type { Lab } from "@/content";
import { Chapter } from "@/story";
import { Container, LeftColumn, Reveal, SectionHeader } from "@/ui";
import { FeaturedProjectCard } from "./FeaturedProjectCard";
import { ProjectCard } from "./ProjectCard";

export function LabSection({ lab }: { readonly lab: Lab }): ReactNode {
  const featured = lab.projects.filter((project) => project.featured);
  const others = lab.projects.filter((project) => !project.featured);

  return (
    <Chapter id="lab" className="py-28 lg:py-44">
      <Container>
        <LeftColumn className="flex flex-col gap-14 lg:gap-20">
          <SectionHeader label={lab.label} heading={lab.heading} intro={lab.intro} />
          <div className="flex flex-col gap-6">
            {featured.map((project) => (
              <Reveal key={project.name}>
                <FeaturedProjectCard project={project} />
              </Reveal>
            ))}
            <div className="grid gap-6 sm:grid-cols-2">
              {others.map((project) => (
                <Reveal key={project.name} className="h-full">
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </div>
          </div>
        </LeftColumn>
      </Container>
    </Chapter>
  );
}
