"use client";

import type { ReactNode } from "react";
import type { NavItem } from "@/content";
import { useActiveChapter, type ChapterId } from "@/story";
import { cx } from "@/ui";

type NavProps = Readonly<{
  name: string;
  items: readonly NavItem[];
}>;

/** The one link that stays visible on narrow screens. */
const ALWAYS_VISIBLE: ChapterId = "contact";

export function Nav({ name, items }: NavProps): ReactNode {
  const active = useActiveChapter();
  const pastHero = active !== "hero";

  return (
    <header
      className={cx(
        "fixed inset-x-0 top-0 z-30 border-b transition-colors duration-500 ease-out-expo",
        pastHero ? "border-line bg-ink-glass backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-6 md:px-10 lg:px-16">
        <a href="#hero" className="font-display text-lg font-semibold tracking-[-0.02em] text-bone">
          {name}
        </a>
        <nav aria-label="Primary" className="flex items-center gap-6 md:gap-8">
          {items.map((item) => {
            const isActive = item.chapter === active;
            return (
              <a
                key={item.chapter}
                href={`#${item.chapter}`}
                aria-current={isActive ? "location" : undefined}
                className={cx(
                  "items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-300",
                  item.chapter === ALWAYS_VISIBLE ? "flex" : "hidden md:flex",
                  isActive ? "text-bone" : "text-bone-dim hover:text-bone",
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    "size-1.5 rounded-full bg-lime transition-opacity duration-300",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                />
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
