import Link from "next/link";
import type { ReactNode } from "react";
import type { CaseStudyCard as CaseStudy, Stat } from "@/content";
import { RepoIllustration } from "@/ui";

type CaseStudyCardProps = Readonly<{
  study: CaseStudy;
  stats: readonly Stat[];
}>;

/** One wide link to the case-study page: the department drawing, the lede, three figures and a call to action. */
export function CaseStudyCard({ study, stats }: CaseStudyCardProps): ReactNode {
  return (
    <Link
      href={study.href}
      className="group grid gap-8 rounded-lg border border-line bg-paper-raised p-6 transition-colors duration-300 hover:border-ink lg:grid-cols-12 lg:items-center lg:gap-12 lg:p-8"
    >
      <div className="lg:col-span-7">
        <RepoIllustration kind="departments" spaced={false} />
      </div>
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
        <h4 className="font-display text-3xl font-semibold tracking-[-0.035em] text-ink md:text-4xl">{study.name}</h4>
        <p className="text-[15px] leading-[1.55] text-ink-soft md:text-base">{study.lede}</p>
        <dl className="flex flex-wrap gap-x-8 gap-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="order-2 font-label text-[11px] font-medium uppercase tracking-[0.14em] text-mute">{stat.label}</dt>
              <dd className="font-dot text-3xl text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-signal-ink">
          {study.cta}
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
