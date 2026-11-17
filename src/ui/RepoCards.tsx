import type { ReactNode } from "react";
import type { Repo, RepoLabels, RepoStatus } from "@/content";
import { cx } from "./cx";
import type { Tone } from "./Tone";
import { ToolList } from "./ToolList";
import { twoDigits } from "./twoDigits";

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

type Skin = Readonly<{ rule: string; heading: string; name: string; description: string; tools: string; separator: string; mute: string }>;

const SKINS: Readonly<Record<Tone, Skin>> = {
  light: {
    rule: "border-line",
    heading: "text-mute",
    name: "text-ink",
    description: "text-ink-soft",
    tools: "text-ink",
    separator: "text-mute",
    mute: "text-mute",
  },
  dark: {
    rule: "border-line-dark",
    heading: "text-fog-dim",
    name: "text-fog",
    description: "text-fog-dim",
    tools: "text-fog",
    separator: "text-fog-dim",
    mute: "text-fog-dim",
  },
};

const MONO_CAPS = "font-mono text-[11px] uppercase tracking-[0.14em]";
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

function StatusBadge({ status, labels }: { readonly status: RepoStatus; readonly labels: RepoLabels }): ReactNode {
  switch (status.kind) {
    case "public":
      return (
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full bg-signal" />
          {labels.public}
        </span>
      );
    case "soon":
      return (
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-2 rounded-full border border-line-strong" />
          {labels.soon}
        </span>
      );
    default:
      return assertNever(status);
  }
}

function Footer({
  status,
  labels,
  ink,
  mute,
}: {
  readonly status: RepoStatus;
  readonly labels: RepoLabels;
  readonly ink: string;
  readonly mute: string;
}): ReactNode {
  switch (status.kind) {
    case "public":
      return (
        <span className={cx("inline-flex items-center gap-1.5 text-sm font-medium", ink)}>
          {labels.open}
          <span aria-hidden className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            ↗
          </span>
        </span>
      );
    case "soon":
      return <span className={cx("text-sm", mute)}>{labels.pending}</span>;
    default:
      return assertNever(status);
  }
}

type CardProps = Readonly<{ repo: Repo; position: number; labels: RepoLabels; skin: Skin; surface: string }>;

function RepoCard({ repo, position, labels, skin, surface }: CardProps): ReactNode {
  const body = (
    <>
      <div className={cx("flex items-center justify-between gap-4", MONO_CAPS, skin.heading)}>
        <span>{`${labels.item} ${twoDigits(position)}`}</span>
        <StatusBadge status={repo.status} labels={labels} />
      </div>
      <h4 className={cx("mt-6 break-words font-mono text-lg font-semibold md:text-xl", skin.name)}>{repo.name}</h4>
      <p className={cx("mt-3 text-[15px] leading-[1.55]", skin.description)}>{repo.description}</p>
      <p className={cx("mt-4 text-sm font-medium leading-[1.7]", skin.tools)}>
        <ToolList tools={repo.tools} separator={skin.separator} />
      </p>
      <div className={cx("mt-auto border-t pt-4", skin.rule)}>
        <Footer status={repo.status} labels={labels} ink={skin.name} mute={skin.mute} />
      </div>
    </>
  );

  switch (repo.status.kind) {
    case "public":
      return (
        <a
          href={repo.status.href}
          target="_blank"
          rel="noreferrer"
          className={cx("group transition-colors duration-300 hover:border-ink", CARD, skin.rule, surface)}
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
    <section aria-label={labels.heading}>
      <div className={cx("flex items-center justify-between border-b pb-3", MONO_CAPS, skin.rule, skin.heading)}>
        <h3 className="font-normal">{labels.heading}</h3>
        <span>{twoDigits(repos.length)}</span>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {repos.map((repo, index) => (
          <li key={repo.name} className="min-w-0">
            <RepoCard repo={repo} position={index + 1} labels={labels} skin={skin} surface={ground} />
          </li>
        ))}
      </ul>
    </section>
  );
}
