import type { ReactNode } from "react";
import type { Repo, RepoLabels, RepoStatus } from "@/content";
import { Chip } from "./Chip";
import { cx } from "./cx";
import { BrandIcon, GITHUB_ICON } from "./icons";
import { RepoIllustration } from "./illustrations";
import type { Tone } from "./Tone";
import { ToolPills } from "./ToolPill";

/** The card ground: `paper` for chapters lighter than it, `raised` for chapters that are paper or darker. */
export type RepoCardSurface = "paper" | "raised";

type RepoCardsProps = Readonly<{
  repos: readonly Repo[];
  labels: RepoLabels;
  /** Which ground the chapter sits on; light by default. */
  tone?: Tone;
  /** The card background; it must contrast with the chapter's own. */
  surface?: RepoCardSurface;
}>;

type Skin = Readonly<{ rule: string; hover: string; name: string; description: string; mark: string }>;

const SKINS: Readonly<Record<Tone, Skin>> = {
  light: {
    rule: "border-line",
    hover: "hover:border-ink",
    name: "text-ink",
    description: "text-ink-soft",
    mark: "text-mute group-hover:text-ink",
  },
  dark: {
    rule: "border-line-dark",
    hover: "hover:border-fog",
    name: "text-fog",
    description: "text-fog-dim",
    mark: "text-fog-dim group-hover:text-fog",
  },
};

const CARD = "flex h-full w-full flex-col rounded-lg border p-6 text-left";

function surfaceClass(surface: RepoCardSurface): string {
  switch (surface) {
    case "paper":
      return "bg-paper";
    case "raised":
      return "bg-paper-raised";
    default:
      return assertNever(surface);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`);
}

type TitleMarkProps = Readonly<{ status: RepoStatus; labels: RepoLabels; skin: Skin; tone: Tone }>;

/** Right of the name: the GitHub mark and an arrow for a public repository, a chip for one still being built. */
function TitleMark({ status, labels, skin, tone }: TitleMarkProps): ReactNode {
  switch (status.kind) {
    case "public":
      return (
        <span className={cx("flex shrink-0 items-center gap-1 pt-1 transition-colors duration-300 md:pt-1.5", skin.mark)}>
          <BrandIcon icon={GITHUB_ICON} className="size-4" />
          <span
            aria-hidden
            className="text-base leading-none transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          >
            ↗
          </span>
          <span className="sr-only">{labels.open}</span>
        </span>
      );
    case "soon":
      return (
        <span className="shrink-0 pt-0.5 md:pt-1">
          <Chip tone={tone}>{labels.pending}</Chip>
        </span>
      );
    default:
      return assertNever(status);
  }
}

type CardProps = Readonly<{ repo: Repo; labels: RepoLabels; skin: Skin; tone: Tone; surface: string }>;

function RepoCard({ repo, labels, skin, tone, surface }: CardProps): ReactNode {
  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <h4 className={cx("min-w-0 break-words font-display text-xl font-semibold tracking-[-0.02em] md:text-2xl", skin.name)}>
          {repo.name}
        </h4>
        <TitleMark status={repo.status} labels={labels} skin={skin} tone={tone} />
      </div>
      <div className="mt-5">
        <RepoIllustration kind={repo.illustration} spaced={false} />
      </div>
      <p className={cx("mt-5 text-[15px] leading-[1.55]", skin.description)}>{repo.description}</p>
      <ToolPills tools={repo.tools} tone={tone} className="mt-auto pt-6" />
    </>
  );

  switch (repo.status.kind) {
    case "public":
      return (
        <a
          href={repo.status.href}
          target="_blank"
          rel="noreferrer"
          className={cx("group transition-colors duration-300", CARD, skin.rule, skin.hover, surface)}
        >
          {body}
        </a>
      );
    case "soon":
      return <article className={cx(CARD, skin.rule, surface)}>{body}</article>;
    default:
      return assertNever(repo.status);
  }
}

/** A grid of repository cards: public ones link to GitHub, in-progress ones say so and link nowhere. */
export function RepoCards({ repos, labels, tone = "light", surface = "paper" }: RepoCardsProps): ReactNode {
  const skin = SKINS[tone];
  const ground = surfaceClass(surface);
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {repos.map((repo) => (
        <li key={repo.name} className="min-w-0">
          <RepoCard repo={repo} labels={labels} skin={skin} tone={tone} surface={ground} />
        </li>
      ))}
    </ul>
  );
}
