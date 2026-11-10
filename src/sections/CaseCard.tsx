import type { ReactNode } from "react";
import type { CaseStudy } from "@/content";
import { BulletList, Chip } from "@/ui";

export function CaseCard({ study }: { readonly study: CaseStudy }): ReactNode {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-ink-glass p-7 backdrop-blur-md transition-colors duration-500 ease-out-expo hover:border-line-strong md:p-10">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-lime transition-transform duration-700 ease-out-expo group-hover:scale-x-100"
      />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <p className="font-display text-4xl font-semibold leading-none tracking-[-0.035em] text-bone md:text-5xl">
            {study.company}
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-bone-dim">{study.period}</p>
        </div>
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-bone-dim">{study.role}</p>
          <h3 className="font-display text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-bone md:text-3xl">
            {study.headline}
          </h3>
          <p className="leading-[1.6] text-bone-dim">{study.summary}</p>
        </div>
        <BulletList items={study.highlights} />
        <ul className="flex flex-wrap gap-2">
          {study.tags.map((tag) => (
            <li key={tag}>
              <Chip>{tag}</Chip>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
