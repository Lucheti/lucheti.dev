import { describe, expect, it } from "vitest";
import { ChapterPosition } from "./ChapterPosition";
import { Progress } from "./Progress";
import { ScrollStory } from "./ScrollStory";
import type { Unsubscribe } from "./Signal";
import type { ChapterAnchor, Viewport } from "./Viewport";

class FakeViewport implements Viewport {
  private listener: () => void = () => undefined;

  public constructor(
    private top: number,
    private readonly distance: number,
  ) {}

  public scrollTop(): number {
    return this.top;
  }

  public scrollableDistance(): number {
    return this.distance;
  }

  public onChange(listener: () => void): Unsubscribe {
    this.listener = listener;
    return () => {
      this.listener = () => undefined;
    };
  }

  public scrollTo(top: number): void {
    this.top = top;
    this.listener();
  }
}

const anchorAt = (top: number): ChapterAnchor => ({ top: () => top });

function storyWithChapters(viewport: Viewport): ScrollStory {
  const story = new ScrollStory(viewport);
  story.anchor("hero", anchorAt(0));
  story.anchor("timeline", anchorAt(1000));
  story.anchor("capabilities", anchorAt(3000));
  story.anchor("craft", anchorAt(3200));
  story.anchor("systems", anchorAt(3500));
  story.anchor("ai", anchorAt(3800));
  // Shorter than the screen: its top can never reach the top of the viewport.
  story.anchor("contact", anchorAt(5400));
  story.follow();
  return story;
}

describe("Progress", () => {
  it("clamps into range and rejects non-finite input", () => {
    expect(Progress.of(-2).toNumber()).toBe(0);
    expect(Progress.of(7).toNumber()).toBe(1);
    expect(() => Progress.of(Number.NaN)).toThrow(RangeError);
  });

  it("re-expresses itself inside a window", () => {
    expect(Progress.of(0.5).within(0.25, 0.75).toNumber()).toBe(0.5);
    expect(Progress.of(0.1).within(0.25, 0.75).toNumber()).toBe(0);
    expect(() => Progress.of(0.5).within(0.6, 0.6)).toThrow(RangeError);
  });
});

describe("ChapterPosition", () => {
  it("splits a continuous number into chapter and blend", () => {
    const position = ChapterPosition.at(1.25);
    expect(position.chapter()).toBe("timeline");
    expect(position.upcoming()).toBe("capabilities");
    expect(position.blend().toNumber()).toBe(0.25);
  });

  it("reports progress through one chapter", () => {
    const position = ChapterPosition.at(1.25);
    expect(position.through("hero").toNumber()).toBe(1);
    expect(position.through("timeline").toNumber()).toBe(0.25);
    expect(position.through("capabilities").toNumber()).toBe(0);
    expect(ChapterPosition.at(99).through("contact").toNumber()).toBe(1);
  });

  it("holds at the final chapter", () => {
    const position = ChapterPosition.at(99);
    expect(position.chapter()).toBe("contact");
    expect(position.upcoming()).toBe("contact");
    expect(position.blend().toNumber()).toBe(0);
  });
});

describe("ScrollStory", () => {
  it("starts at the beginning", () => {
    const story = storyWithChapters(new FakeViewport(0, 5000));
    expect(story.page().current().toNumber()).toBe(0);
    expect(story.chapters().current().toNumber()).toBe(0);
  });

  it("blends between chapters by scroll distance, not page fraction", () => {
    const viewport = new FakeViewport(0, 5000);
    const story = storyWithChapters(viewport);
    viewport.scrollTo(2000);
    expect(story.page().current().toNumber()).toBe(0.4);
    expect(story.chapters().current().toNumber()).toBe(1.5);
    expect(story.through("timeline").current().toNumber()).toBe(0.5);
  });

  it("reaches the final chapter at the end of the page", () => {
    const viewport = new FakeViewport(0, 5000);
    const story = storyWithChapters(viewport);
    viewport.scrollTo(5000);
    expect(story.page().current().toNumber()).toBe(1);
    expect(story.chapters().current().chapter()).toBe("contact");
  });

  it("notifies subscribers only when the value changes", () => {
    const viewport = new FakeViewport(0, 5000);
    const story = storyWithChapters(viewport);
    const seen: number[] = [];
    story.page().subscribe((progress) => seen.push(progress.toNumber()));
    viewport.scrollTo(2500);
    viewport.scrollTo(2500);
    expect(seen).toEqual([0.5]);
  });

  it("tracks one chapter and only notifies when that chapter moves", () => {
    const viewport = new FakeViewport(0, 5000);
    const story = storyWithChapters(viewport);
    const timeline = story.through("timeline");
    const seen: number[] = [];
    timeline.subscribe((progress) => seen.push(progress.toNumber()));
    viewport.scrollTo(500);
    viewport.scrollTo(2000);
    viewport.scrollTo(4500);
    viewport.scrollTo(4600);
    expect(seen).toEqual([0.5, 1]);
    expect(story.through("timeline")).toBe(timeline);
  });

  it("stays at the start when the page cannot scroll", () => {
    const story = storyWithChapters(new FakeViewport(0, 0));
    expect(story.page().current().toNumber()).toBe(0);
    expect(story.chapters().current().toNumber()).toBe(0);
  });
});
