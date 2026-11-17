import type { DiffusionFraming, DiffusionMood, DiffusionSubject } from "@/content";
import { PaletteBook } from "./Palette";
import { SeededRandom } from "./SeededRandom";
import { assertNever, Camera, type Point, type Scene } from "./SceneShapes";
import { SubjectArtFactory } from "./SubjectArt";

/** The three choices that build a prompt. */
export type PromptChips = Readonly<{
  subject: DiffusionSubject;
  mood: DiffusionMood;
  framing: DiffusionFraming;
}>;

const WIDE_CENTRE: Point = { x: 80, y: 50 };

/**
 * Turns chips and a seed into a picture: a list of shapes and colours. Pure and deterministic, so the same
 * chips and seed always give the same scene, and another seed re-rolls the composition.
 */
export class SceneRecipe {
  public static compose(chips: PromptChips, seed: number): Scene {
    const random = new SeededRandom(SceneRecipe.mix(chips, seed));
    const palette = PaletteBook.of(chips.mood);
    const art = SubjectArtFactory.for(chips.subject).compose({ random, palette, mood: chips.mood });
    const camera = SceneRecipe.cameraFor(chips.framing, art.focus, art.closeZoom);
    return { sky: art.sky, shapes: art.parts.map((part) => camera.frame(part)) };
  }

  private static cameraFor(framing: DiffusionFraming, focus: Point, closeZoom: number): Camera {
    switch (framing) {
      case "wide":
        return new Camera(1, WIDE_CENTRE);
      case "close-up":
        return new Camera(closeZoom, focus);
      default:
        return assertNever(framing);
    }
  }

  /**
   * The random source starts from the seed alone, so the same seed lays out the same elements whatever the
   * framing: switching to a close-up crops the very picture the wide shot showed.
   */
  private static mix(chips: PromptChips, seed: number): number {
    return seed * 16 + SceneRecipe.salt(chips);
  }

  private static salt(chips: PromptChips): number {
    // Subject and mood change what is drawn; framing deliberately does not.
    return SUBJECT_SALT[chips.subject] * 4 + MOOD_SALT[chips.mood];
  }
}

const SUBJECT_SALT: Readonly<Record<DiffusionSubject, number>> = { lighthouse: 0, vase: 1, mountain: 2, city: 3 };
const MOOD_SALT: Readonly<Record<DiffusionMood, number>> = { dusk: 0, night: 1, morning: 2, storm: 3 };
