"use client";

import type { ReactNode } from "react";
import type { NavItem } from "@/content";
import { useActiveChapter, type ChapterId } from "@/story";
import { Container, cx, initialsOf } from "@/ui";
import { LiveClock } from "./LiveClock";

type NavProps = Readonly<{
  name: string;
  items: readonly NavItem[];
  timeZone: string;
  city: string;
}>;

type NavSurface = Readonly<{
  bar: string;
  monogram: string;
  name: string;
  clock: string;
  active: string;
  idle: string;
}>;

const TRANSPARENT: NavSurface = {
  bar: "border-transparent bg-transparent",
  monogram: "bg-ink text-paper",
  name: "text-ink",
  clock: "text-mute",
  active: "text-ink",
  idle: "text-mute hover:text-ink",
};

const PAPER: NavSurface = {
  ...TRANSPARENT,
  bar: "border-line bg-paper/80 backdrop-blur-md",
};

const GRAPHITE: NavSurface = {
  bar: "border-line-dark bg-graphite/80 backdrop-blur-md",
  monogram: "bg-fog text-graphite",
  name: "text-fog",
  clock: "text-fog-dim",
  active: "text-fog",
  idle: "text-fog-dim hover:text-fog",
};

function surfaceFor(chapter: ChapterId): NavSurface {
  switch (chapter) {
    case "hero":
      return TRANSPARENT;
    case "capabilities":
      return GRAPHITE;
    case "timeline":
    case "craft":
    case "ai":
    case "systems":
    case "contact":
      return PAPER;
    default:
      return assertNever(chapter);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled chapter: ${String(value)}`);
}

/** Fixed chrome: monogram, chapter links with the active one marked, and the live clock. */
export function Nav({ name, items, timeZone, city }: NavProps): ReactNode {
  const chapter = useActiveChapter();
  const surface = surfaceFor(chapter);

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-40 h-14 border-b transition-colors duration-300 ease-out-expo",
        surface.bar,
      )}
    >
      <Container className="flex h-full items-center justify-between gap-6">
        <a href="#hero" aria-label={name} className="flex flex-1 items-center gap-3">
          <span
            aria-hidden
            className={cx(
              "flex size-7 items-center justify-center rounded-[3px] font-label text-[11px] font-medium tracking-[0.04em] transition-colors duration-300",
              surface.monogram,
            )}
          >
            {initialsOf(name)}
          </span>
          <span
            className={cx(
              "hidden font-label font-medium text-[11px] uppercase tracking-[0.14em] transition-colors duration-300 md:inline",
              surface.name,
            )}
          >
            {name}
          </span>
        </a>

        <nav aria-label="Chapters" className="hidden items-center gap-8 md:flex">
          {items.map((item) => {
            const isActive = item.chapter === chapter;
            return (
              <a
                key={item.chapter}
                href={`#${item.chapter}`}
                aria-current={isActive ? "location" : undefined}
                className={cx(
                  "flex items-center gap-2 font-label font-medium text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
                  isActive ? surface.active : surface.idle,
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "size-1.5 bg-signal transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex flex-1 justify-end">
          <LiveClock
            timeZone={timeZone}
            city={city}
            className={cx(
              "font-label font-medium text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
              surface.clock,
            )}
          />
        </div>
      </Container>
    </header>
  );
}
