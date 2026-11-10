"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import type { ChapterId } from "./ChapterPosition";
import { ScrollStory } from "./ScrollStory";
import type { Story } from "./Story";
import { BrowserViewport, ElementAnchor } from "./Viewport";

const StoryContext = createContext<ScrollStory | null>(null);

function useScrollStory(): ScrollStory {
  const story = useContext(StoryContext);
  if (!story) {
    throw new Error("Story hooks and <Chapter> must be used inside <StoryProvider>");
  }
  return story;
}

/** Composition root for the scroll story: builds it once and follows the window. */
export function StoryProvider({ children }: { readonly children: ReactNode }): ReactNode {
  const [story] = useState(() => new ScrollStory(new BrowserViewport()));

  useEffect(() => story.follow(), [story]);

  return <StoryContext.Provider value={story}>{children}</StoryContext.Provider>;
}

/** The story, for reading inside animation loops or subscribing to changes. */
export function useStory(): Story {
  return useScrollStory();
}

/** Re-renders only when the reader crosses into a different chapter. */
export function useActiveChapter(): ChapterId {
  const chapters = useScrollStory().chapters();
  return useSyncExternalStore(
    (onChange) => chapters.subscribe(onChange),
    () => chapters.current().chapter(),
    () => "hero" as const,
  );
}

type ChapterProps = Omit<ComponentPropsWithoutRef<"section">, "id"> & {
  readonly id: ChapterId;
};

/** A page section that marks the start of a chapter of the story. */
export function Chapter({ id, children, ...rest }: ChapterProps): ReactNode {
  const story = useScrollStory();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return undefined;
    }
    return story.anchor(id, new ElementAnchor(ref.current));
  }, [story, id]);

  return (
    <section ref={ref} id={id} data-chapter={id} {...rest}>
      {children}
    </section>
  );
}
