import { Fragment, type CSSProperties, type ReactNode } from "react";
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

/** A dotted arrow drawn by hand, curving up from the sticky note into the card above it. */
function NoteArrow(): ReactNode {
  return (
    <svg
      aria-hidden
      viewBox="0 0 140 92"
      fill="none"
      className="pointer-events-none absolute -left-2 -top-[88px] h-[92px] w-[140px] text-ink"
    >
      <path d="M118 90 C 122 52, 62 52, 48 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.5 8" />
      <path d="M36 20 L 47 7 L 59 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A sticky note under a card, pointing up at it with a dotted arrow: a line about the repository and a button
 * to more about it on this site. Slightly turned, like paper stuck to the page.
 */
function StickyNote({ feature }: Readonly<{ feature: RepoFeature }>): ReactNode {
  return (
    <div className="relative ml-[8%] mt-14 max-w-[24rem] md:ml-[14%]">
      <NoteArrow />
      <div className="relative -rotate-[1.5deg] rounded-[3px] bg-[#ffe7a1] px-5 pb-5 pt-6 text-ink shadow-[0_1px_1px_rgb(60_40_0/0.08),0_14px_24px_-14px_rgb(60_40_0/0.45)]">
        <span aria-hidden className="absolute -top-2.5 right-8 h-5 w-16 rotate-[3deg] bg-white/55 shadow-[0_1px_2px_rgb(0_0_0/0.08)]" />
        <p className="text-[15px] leading-[1.5]">{feature.note}</p>
        <div className="mt-4">
          <ButtonLink href={feature.href}>{feature.cta}</ButtonLink>
        </div>
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
    </article>
  );
}

/** Where a card and its note sit in the two-column grid: the card in its row, its note in the row below it. */
type GridCell = Readonly<{ "--col": number; "--row": number }>;

function cardCell(index: number): GridCell {
  return { "--col": (index % 2) + 1, "--row": Math.floor(index / 2) * 2 + 1 };
}

function noteCell(index: number): GridCell {
  return { "--col": (index % 2) + 1, "--row": Math.floor(index / 2) * 2 + 2 };
}

const PLACED = "md:[grid-column:var(--col)] md:[grid-row:var(--row)]";

/**
 * A grid of repository cards: public ones link to GitHub, in-progress ones say so and link nowhere. A card
 * with a feature gets a sticky note under it; on phones the note follows its own card.
 */
export function RepoCards({ repos, labels, tone = "light" }: RepoCardsProps): ReactNode {
  const skin = SKINS[tone];
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {repos.map((repo, index) => (
        <Fragment key={repo.name}>
          <li className={cx("min-w-0", PLACED)} style={cardCell(index) as CSSProperties}>
            <RepoCard repo={repo} labels={labels} skin={skin} tone={tone} />
          </li>
          {repo.feature === undefined ? null : (
            <li className={cx("min-w-0", PLACED)} style={noteCell(index) as CSSProperties}>
              <StickyNote feature={repo.feature} />
            </li>
          )}
        </Fragment>
      ))}
    </ul>
  );
}
