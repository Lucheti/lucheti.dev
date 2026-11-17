import { useMemo, type ReactNode } from "react";
import { cx } from "@/ui";
import { SceneRecipe } from "./SceneRecipe";
import { SceneSvg } from "./SceneSvg";
import type { Generation } from "./Generation";

/** How many past pictures the strip keeps. */
export const GALLERY_SIZE = 4;

type ThumbProps = Readonly<{
  generation: Generation;
  label: string;
  current: boolean;
  onPick: (generation: Generation) => void;
}>;

/** One past picture as a button; picking it shows it again. */
function Thumb({ generation, label, current, onPick }: ThumbProps): ReactNode {
  const scene = useMemo(() => SceneRecipe.compose(generation.chips, generation.seed), [generation]);
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={current}
      onClick={() => onPick(generation)}
      className={cx(
        "relative aspect-[16/10] min-w-0 cursor-pointer overflow-hidden rounded-md transition-[box-shadow,transform] duration-200 active:scale-95 motion-reduce:transition-none",
        current ? "ring-2 ring-signal ring-offset-1 ring-offset-white" : "ring-1 ring-line-strong hover:ring-ink",
      )}
    >
      <SceneSvg scene={scene} />
    </button>
  );
}

type GalleryStripProps = Readonly<{
  label: string;
  generations: readonly Generation[];
  current: Generation;
  /** How a picture is named for assistive technology. */
  describe: (generation: Generation) => string;
  onPick: (generation: Generation) => void;
}>;

/** The last few generations as a row of thumbnails, newest first, with dashed slots for those not made yet. */
export function GalleryStrip({ label, generations, current, describe, onPick }: GalleryStripProps): ReactNode {
  const empty = Math.max(0, GALLERY_SIZE - generations.length);
  return (
    <div role="group" aria-label={label} className="grid grid-cols-4 gap-2">
      {generations.map((generation) => (
        <Thumb
          key={generation.id}
          generation={generation}
          label={describe(generation)}
          current={generation.id === current.id}
          onPick={onPick}
        />
      ))}
      {Array.from({ length: empty }, (_, slot) => (
        <span key={`empty-${slot}`} aria-hidden className="aspect-[16/10] rounded-md border border-dashed border-line-strong" />
      ))}
    </div>
  );
}
