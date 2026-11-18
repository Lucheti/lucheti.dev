import { Fragment, type ReactNode } from "react";
import type { Repo, RepoLabels } from "@/content";
import { BrandIcon, GITHUB_ICON } from "./icons";
import { RepoIllustration } from "./illustrations";
import { StickyNote } from "./StickyNote";
import { ToolPills } from "./ToolPill";

type RepoListProps = Readonly<{ repos: readonly Repo[]; labels: RepoLabels }>;

/** One compact repository card: a small drawing, the name (the link to GitHub, stretched over the card), a short description and small tool pills. */
function RepoRow({ repo, labels }: Readonly<{ repo: Repo; labels: RepoLabels }>): ReactNode {
  return (
    <li className="group relative flex gap-4 rounded-2xl bg-white p-4 text-ink shadow-[0_30px_70px_-40px_rgb(14_14_14/0.35)] ring-1 ring-inset ring-line transition-shadow duration-300 hover:ring-ink sm:p-5">
      <div className="w-28 shrink-0 self-start sm:w-32">
        <RepoIllustration kind={repo.illustration} spaced={false} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="truncate text-[17px] font-semibold tracking-[-0.02em]">
            {repo.status.kind === "public" ? (
              <a href={repo.status.href} target="_blank" rel="noreferrer" className="after:absolute after:inset-0 after:rounded-2xl">
                {repo.name}
                <span className="sr-only">, {labels.open}</span>
              </a>
            ) : (
              repo.name
            )}
          </h4>
          <span aria-hidden className="flex shrink-0 items-center gap-1 text-mute transition-colors duration-300 group-hover:text-ink">
            <BrandIcon icon={GITHUB_ICON} className="size-3.5" />
            <span className="text-sm leading-none">↗</span>
          </span>
        </div>
        <p className="line-clamp-2 text-[13px] leading-[1.5] text-ink-soft">{repo.description}</p>
        <ToolPills tools={repo.tools.slice(0, 4)} size="sm" className="mt-1.5" />
      </div>
    </li>
  );
}

/**
 * Compact repository cards for a chapter's narrow column, in the white card style of the skill card. A
 * repository with a feature gets a sticky note right under its card, pointing up at it.
 */
export function RepoList({ repos, labels }: RepoListProps): ReactNode {
  return (
    <ul className="flex flex-col gap-3">
      {repos.map((repo) => (
        <Fragment key={repo.name}>
          <RepoRow repo={repo} labels={labels} />
          {repo.feature === undefined ? null : (
            <li className="pb-4">
              <StickyNote feature={repo.feature} />
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  );
}
