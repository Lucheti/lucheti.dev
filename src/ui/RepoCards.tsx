import type { ReactNode } from "react";
import type { Repo, RepoFeature, RepoLabels, RepoStatus } from "@/content";
import { ButtonLink } from "./ButtonLink";
import { Chip } from "./Chip";
import { cx } from "./cx";
import { BrandIcon, GITHUB_ICON } from "./icons";
import { RepoIllustration } from "./illustrations";
import type { Tone } from "./Tone";
import { ToolPills } from "./ToolPill";

type RepoCardsProps = Readonly<{
  repos: readonly Repo[];
  labels: RepoLabels;
  /** Which ground the chapter sits on; light by default. */
  tone?: Tone;
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

/** White cards, the same ground as the feature panels and the skill card. */
const CARD = "relative flex h-full w-full flex-col rounded-lg border bg-white p-6 text-left";

function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${String(value)}`);
}

type TitleProps = Readonly<{ repo: Repo; labels: RepoLabels; skin: Skin; tone: Tone }>;

/**
 * The card's title row. A public repository's name is the link to GitHub, stretched over the whole card so
 * the card clicks through; the GitHub mark and arrow beside it are drawn for the eye. A repository still
 * being built has a chip instead and links nowhere.
 */
function Title({ repo, labels, skin, tone }: TitleProps): ReactNode {
  const name = cx("min-w-0 break-words font-display text-xl font-semibold tracking-[-0.02em] md:text-2xl", skin.name);
  const status: RepoStatus = repo.status;
  switch (status.kind) {
    case "public":
      return (
        <div className="flex items-start justify-between gap-4">
          <h4 className={name}>
            <a href={status.href} target="_blank" rel="noreferrer" className="after:absolute after:inset-0 after:rounded-lg">
              {repo.name}
              <span className="sr-only">, {labels.open}</span>
            </a>
          </h4>
          <span aria-hidden className={cx("flex shrink-0 items-center gap-1 pt-1 transition-colors duration-300 md:pt-1.5", skin.mark)}>
            <BrandIcon icon={GITHUB_ICON} className="size-4" />
            <span className="text-base leading-none transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
          </span>
        </div>
      );
    case "soon":
      return (
        <div className="flex items-start justify-between gap-4">
          <h4 className={name}>{repo.name}</h4>
          <span className="shrink-0 pt-0.5 md:pt-1">
            <Chip tone={tone}>{labels.pending}</Chip>
          </span>
        </div>
      );
    default:
      return assertNever(status);
  }
}

/** A note on a card that points somewhere else on the site, with its own button above the card's link. */
function FeatureNote({ feature }: Readonly<{ feature: RepoFeature }>): ReactNode {
  return (
    <div className="relative z-10 mt-6 flex flex-col gap-4 rounded-md bg-signal-soft/60 p-4 ring-1 ring-inset ring-signal/25 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[15px] leading-[1.5] text-ink">{feature.note}</p>
      <div className="shrink-0">
        <ButtonLink href={feature.href}>{feature.cta}</ButtonLink>
      </div>
    </div>
  );
}

function RepoCard({ repo, labels, skin, tone }: TitleProps): ReactNode {
  const linked = repo.status.kind === "public";
  return (
    <article className={cx(CARD, skin.rule, linked && cx("group transition-colors duration-300", skin.hover))}>
      <Title repo={repo} labels={labels} skin={skin} tone={tone} />
      <div className="mt-5">
        <RepoIllustration kind={repo.illustration} spaced={false} />
      </div>
      <p className={cx("mt-5 text-[15px] leading-[1.55]", skin.description)}>{repo.description}</p>
      <ToolPills tools={repo.tools} tone={tone} className="mt-auto pt-6" />
      {repo.feature === undefined ? null : <FeatureNote feature={repo.feature} />}
    </article>
  );
}

/** A grid of repository cards: public ones link to GitHub, in-progress ones say so and link nowhere. */
export function RepoCards({ repos, labels, tone = "light" }: RepoCardsProps): ReactNode {
  const skin = SKINS[tone];
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {repos.map((repo) => (
        <li key={repo.name} className="min-w-0">
          <RepoCard repo={repo} labels={labels} skin={skin} tone={tone} />
        </li>
      ))}
    </ul>
  );
}
