import type { DiffusionMood, DiffusionSubject } from "@/content";
import { ACCENT, type Palette } from "./Palette";
import type { SeededRandom } from "./SeededRandom";
import { assertNever, Draw, PICTURE_WIDTH, type Part, type Point, type Shape } from "./SceneShapes";

/** What a subject needs to draw itself. */
export type ArtContext = Readonly<{ random: SeededRandom; palette: Palette; mood: DiffusionMood }>;

/** A subject drawn in picture space, before any camera. */
export type Composition = Readonly<{
  /** The sky, or the wall of an interior. */
  sky: Readonly<{ top: string; bottom: string }>;
  /** Where a close-up looks. */
  focus: Point;
  /** How far a close-up zooms in on the focus. */
  closeZoom: number;
  /** Shapes back to front. */
  parts: readonly Part[];
}>;

/** One subject's way of drawing itself; a new subject is a new class, not an edit to the others. */
export interface SubjectArt {
  compose(context: ArtContext): Composition;
}

/** Where the ground, the sea or the table begins. */
const HORIZON = 72;
/** Wide enough that a zoomed camera never runs out of ground. */
const FLOOR_SPAN = 400;

function layer(depth: number, shapes: readonly Shape[]): readonly Part[] {
  return shapes.map((shape) => ({ shape, depth }));
}

/** The sky's contents for the mood: sun or moon, clouds, stars, rain. */
class Weather {
  public constructor(private readonly context: ArtContext) {}

  /** `bodyX` is where the sun or moon sits across the picture. */
  public compose(bodyX: number): readonly Part[] {
    const { random, palette, mood } = this.context;
    switch (mood) {
      case "dusk":
        return [
          ...layer(0.1, [
            Draw.circle(bodyX, 62, 21, palette.glow, 0.22),
            Draw.circle(bodyX, 62, 13, palette.glow, 0.45),
            Draw.circle(bodyX, 62, 9.5, palette.glow),
          ]),
          ...layer(0.2, [
            ...Draw.cloud(random.range(15, 50), random.range(20, 32), 1.1, palette.cloud, 0.7),
            ...Draw.cloud(random.range(100, 140), random.range(30, 44), 0.9, palette.cloud, 0.6),
          ]),
        ];
      case "night": {
        const stars: Shape[] = [];
        for (let i = 0; i < random.int(16, 24); i += 1) {
          stars.push(Draw.circle(random.range(4, 156), random.range(3, 52), random.range(0.4, 1), palette.glow, random.range(0.5, 1)));
        }
        return [
          ...layer(0, stars),
          ...layer(0.1, [
            Draw.circle(bodyX, 24, 17, palette.glow, 0.14),
            Draw.circle(bodyX, 24, 8.5, palette.glow),
            Draw.circle(bodyX + 3, 22, 7.4, palette.skyTop, 0.9),
          ]),
          ...layer(0.2, Draw.cloud(random.range(20, 130), random.range(34, 46), 1, palette.cloud, 0.55)),
        ];
      }
      case "morning":
        return [
          ...layer(0.1, [
            Draw.circle(bodyX, 38, 18, palette.glow, 0.3),
            Draw.circle(bodyX, 38, 9, palette.glow),
          ]),
          ...layer(0.2, [
            ...Draw.cloud(random.range(12, 60), random.range(18, 30), 1.2, palette.cloud, 0.95),
            ...Draw.cloud(random.range(90, 140), random.range(26, 40), 1, palette.cloud, 0.9),
          ]),
        ];
      case "storm": {
        const rain: Shape[] = [];
        for (let i = 0; i < random.int(26, 34); i += 1) {
          const x = random.range(-4, 164);
          const y = random.range(8, 88);
          rain.push(Draw.line(x, y, x - 2.4, y + 7, 0.5, palette.paper, random.range(0.3, 0.6)));
        }
        const bolt: readonly Shape[] = random.chance(0.8)
          ? [Draw.polygon([[bodyX, 26], [bodyX - 6, 44], [bodyX - 1, 44], [bodyX - 5, 60], [bodyX + 6, 40], [bodyX + 1, 40], [bodyX + 5, 26]], palette.light, 0.92)]
          : [];
        return [
          ...layer(0.15, [
            ...Draw.cloud(28, 20, 1.8, palette.cloud, 0.95),
            ...Draw.cloud(86, 14, 2, palette.cloud, 0.95),
            ...Draw.cloud(140, 24, 1.8, palette.cloud, 0.95),
          ]),
          ...layer(0.3, bolt),
          ...layer(0.6, rain),
        ];
      }
      default:
        return assertNever(mood);
    }
  }
}

/** Is a lit window likely on? Mostly after dark. */
function lightChance(mood: DiffusionMood): number {
  switch (mood) {
    case "night":
      return 0.6;
    case "dusk":
    case "storm":
      return 0.4;
    case "morning":
      return 0.08;
    default:
      return assertNever(mood);
  }
}

/** A striped lighthouse on a rock in the sea, its beam sweeping across the water. */
class LighthouseArt implements SubjectArt {
  public compose(context: ArtContext): Composition {
    const { random, palette, mood } = context;
    // The tower stands on one side, the beam and the sun on the other.
    const facing = random.chance(0.5) ? -1 : 1;
    const lx = facing === -1 ? random.range(100, 118) : random.range(42, 60);
    const bodyX = facing === -1 ? random.range(28, 66) : random.range(94, 132);
    const halfWidth = (y: number): number => 4.5 + ((y - 32) / 36) * 2.5;
    const band = (top: number, bottom: number): Shape =>
      Draw.polygon([[lx - halfWidth(top), top], [lx + halfWidth(top), top], [lx + halfWidth(bottom), bottom], [lx - halfWidth(bottom), bottom]], ACCENT);

    const beamOpacity = mood === "morning" ? 0.1 : mood === "night" ? 0.36 : 0.26;
    const sea: Shape[] = [Draw.rect(-FLOOR_SPAN / 2, HORIZON, FLOOR_SPAN * 1.5, 160, Draw.fade(palette.mid, palette.ground))];
    for (let i = 0; i < random.int(7, 10); i += 1) {
      const y = random.range(HORIZON + 4, 96);
      const x = random.range(6, 150);
      const half = random.range(3, 8);
      sea.push(Draw.line(x - half, y, x + half, y, 0.9, palette.paper, random.range(0.25, 0.5)));
    }
    const glints: Shape[] = mood === "storm" ? [] : [0, 1, 2].map((row) => Draw.line(bodyX - 8 + row * 2, 76 + row * 5, bodyX + 8 - row * 2, 76 + row * 5, 1, palette.glow, 0.55 - row * 0.12));
    const gulls: Shape[] = [];
    if (mood === "morning" || mood === "dusk") {
      for (let i = 0; i < random.int(1, 3); i += 1) {
        const gx = random.range(20, 140);
        const gy = random.range(14, 40);
        gulls.push(Draw.line(gx - 3, gy, gx, gy - 1.6, 0.7, palette.ink, 0.8), Draw.line(gx, gy - 1.6, gx + 3, gy, 0.7, palette.ink, 0.8));
      }
    }

    const parts: Part[] = [
      ...new Weather(context).compose(bodyX),
      ...layer(0.3, [Draw.ellipse(facing === -1 ? 34 : 126, HORIZON, 24, 3.6, palette.far)]),
      ...layer(0.6, sea),
      ...layer(0.6, glints),
      ...layer(0.7, gulls),
      ...layer(1, [
        Draw.polygon([[lx - 24, 90], [lx - 15, 74], [lx - 5, 66], [lx + 8, 68], [lx + 20, 78], [lx + 28, 90]], palette.ink),
        Draw.polygon([[lx - 5, 66], [lx + 8, 68], [lx + 20, 78], [lx + 28, 90], [lx + 6, 90]], palette.mid, 0.55),
        Draw.polygon([[lx - halfWidth(68), 68], [lx + halfWidth(68), 68], [lx + halfWidth(32), 32], [lx - halfWidth(32), 32]], palette.paper),
        band(60, 53),
        band(45, 38),
        Draw.rect(lx - 6.2, 30, 12.4, 2, palette.ink),
        Draw.rect(lx - 4.6, 22, 9.2, 8.4, palette.ink),
        Draw.rect(lx - 3.1, 23.6, 6.2, 5.2, palette.light),
        Draw.polygon([[lx - 6.5, 22], [lx + 6.5, 22], [lx, 14]], ACCENT),
        Draw.circle(lx, 13.4, 1.3, palette.ink),
        Draw.polygon([[lx, 24.5], [lx + facing * 120, 6], [lx + facing * 120, 44], [lx, 27.5]], palette.light, beamOpacity),
        Draw.ellipse(lx, 91, 36, 3.2, palette.paper, 0.4),
      ]),
    ];
    return { sky: { top: palette.skyTop, bottom: palette.skyBottom }, focus: { x: lx, y: 30 }, closeZoom: 2.3, parts };
  }
}

/** Snowy peaks over a pine-lined meadow and a small lake. */
class MountainArt implements SubjectArt {
  public compose(context: ArtContext): Composition {
    const { random, palette } = context;
    const bodyX = random.range(24, 136);
    const baseY = 76;
    const mountains: Shape[] = [];
    const peak = (cx: number, top: number, half: number, color: string): void => {
      const height = baseY - top;
      const cap = height * 0.3;
      const w = (half * cap) / height;
      mountains.push(
        Draw.polygon([[cx - half, baseY], [cx, top], [cx + half, baseY]], color),
        Draw.polygon([[cx, top], [cx + half, baseY], [cx + half * 0.2, baseY]], palette.ink, 0.22),
        Draw.polygon(
          [[cx, top], [cx + w, top + cap], [cx + w * 0.45, top + cap * 0.72], [cx, top + cap * 1.05], [cx - w * 0.45, top + cap * 0.72], [cx - w, top + cap]],
          palette.paper,
        ),
      );
    };
    const mx = random.range(62, 98);
    peak(mx - random.range(38, 48), random.range(40, 48), random.range(30, 36), palette.far);
    peak(mx + random.range(34, 46), random.range(38, 46), random.range(30, 38), palette.far);
    peak(mx, random.range(18, 26), random.range(40, 48), palette.mid);

    const pines: Shape[] = [];
    for (let i = 0; i < random.int(9, 13); i += 1) {
      const x = random.range(4, 156);
      const y = random.range(78, 94);
      const h = random.range(9, 15) * (y / 86);
      pines.push(
        Draw.rect(x - 0.7, y - 1.6, 1.4, 2.6, palette.ink),
        Draw.polygon([[x - h * 0.32, y - 1.4], [x + h * 0.32, y - 1.4], [x, y - h * 0.62]], palette.foliage),
        Draw.polygon([[x - h * 0.25, y - h * 0.4], [x + h * 0.25, y - h * 0.4], [x, y - h]], palette.foliage),
      );
    }
    const parts: Part[] = [
      ...new Weather(context).compose(bodyX),
      ...layer(0.35, [Draw.ellipse(30, baseY, 50, 8, palette.far), Draw.ellipse(140, baseY, 46, 6, palette.far)]),
      ...layer(0.7, mountains),
      ...layer(1, [
        Draw.rect(-FLOOR_SPAN / 2, baseY, FLOOR_SPAN * 1.5, 160, Draw.fade(palette.ground, palette.ink)),
        Draw.ellipse(random.range(50, 110), 88, random.range(22, 32), 4.4, palette.skyBottom, 0.7),
      ]),
      ...layer(1, pines),
    ];
    return { sky: { top: palette.skyTop, bottom: palette.skyBottom }, focus: { x: mx, y: 34 }, closeZoom: 2.2, parts };
  }
}

/** A row of rooftops with lit windows and a street, one building in the accent colour. */
class CityArt implements SubjectArt {
  public compose(context: ArtContext): Composition {
    const { random, palette, mood } = context;
    const bodyX = random.range(24, 136);
    const lit = lightChance(mood);
    const behind: Shape[] = [];
    for (let x = -6; x < PICTURE_WIDTH; ) {
      const w = random.range(8, 14);
      const h = random.range(22, 44);
      behind.push(Draw.rect(x, HORIZON - h, w, h + 2, palette.far));
      x += w + random.range(0, 2);
    }

    const front: Shape[] = [];
    let tallest = { x: 80, top: HORIZON };
    const accentAt = random.int(2, 5);
    let index = 0;
    for (let x = 2; x < PICTURE_WIDTH - 6; index += 1) {
      const w = random.range(11, 17);
      const h = random.range(28, 56);
      const top = HORIZON - h;
      if (top < tallest.top || tallest.top === HORIZON) {
        tallest = { x: x + w / 2, top };
      }
      front.push(Draw.rect(x, top, w, h + 2, index === accentAt ? ACCENT : palette.mid));
      if (random.chance(0.5)) {
        front.push(Draw.rect(x + w / 2 - 0.5, top - 5, 1, 5, palette.ink, 0.8));
      } else {
        front.push(Draw.rect(x - 0.8, top - 1.6, w + 1.6, 1.6, palette.ink, 0.5));
      }
      for (let wx = x + 2; wx + 2 < x + w - 0.5; wx += 3.6) {
        for (let wy = top + 3; wy + 2.4 < HORIZON - 2; wy += 5) {
          const on = random.chance(lit);
          front.push(Draw.rect(wx, wy, 2, 2.8, on ? palette.light : palette.ink, on ? 0.95 : 0.22, 0.4));
        }
      }
      x += w + random.range(1, 3);
    }

    const street: Shape[] = [Draw.rect(-FLOOR_SPAN / 2, HORIZON, FLOOR_SPAN * 1.5, 160, palette.ink)];
    for (let x = 4; x < PICTURE_WIDTH; x += 20) {
      street.push(Draw.rect(x, 88, 10, 1.6, palette.paper, 0.55, 0.8));
    }
    const parts: Part[] = [
      ...new Weather(context).compose(bodyX),
      ...layer(0.35, behind),
      ...layer(1, front),
      ...layer(1, street),
    ];
    return { sky: { top: palette.skyTop, bottom: palette.skyBottom }, focus: { x: tallest.x, y: tallest.top + 6 }, closeZoom: 2.2, parts };
  }
}

const CERAMICS: readonly string[] = [ACCENT, "#2fa39a", "#f4e9d8", "#5b7fd6"];
const PETALS: readonly string[] = [ACCENT, "#ffd23f", "#ff8fb3", "#ffffff"];

/** A ceramic vase of flowers on a table, with a window and its light. */
class VaseArt implements SubjectArt {
  public compose(context: ArtContext): Composition {
    const { random, palette, mood } = context;
    const vx = random.range(66, 94);
    const wx = vx < 80 ? 112 : 16;
    const ceramic = random.pick(CERAMICS);
    const shade = mood === "night" ? 0.35 : mood === "storm" ? 0.22 : mood === "dusk" ? 0.12 : 0;

    const window: Shape[] = [
      Draw.rect(wx - 2, 12, 36, 52, palette.paper, 1, 3),
      Draw.rect(wx, 14, 32, 46, Draw.fade(palette.skyTop, palette.skyBottom), 1, 2),
    ];
    if (mood === "storm") {
      window.push(...Draw.cloud(wx + 16, 30, 1.1, palette.cloud, 0.9), Draw.line(wx + 8, 40, wx + 6, 47, 0.6, palette.paper, 0.6), Draw.line(wx + 22, 41, wx + 20, 48, 0.6, palette.paper, 0.6));
    } else if (mood === "night") {
      window.push(Draw.circle(wx + 20, 28, 5, palette.glow), Draw.circle(wx + 22.2, 27, 4.3, palette.skyTop, 0.95), Draw.circle(wx + 8, 22, 0.7, palette.glow), Draw.circle(wx + 12, 40, 0.6, palette.glow));
    } else {
      window.push(Draw.circle(wx + 16, mood === "dusk" ? 46 : 30, 6, palette.glow));
    }
    window.push(Draw.rect(wx + 15.4, 14, 1.2, 46, palette.paper), Draw.rect(wx, 36.4, 32, 1.2, palette.paper), Draw.rect(wx - 4, 62, 40, 3.4, palette.paper, 1, 1));

    const stems: Shape[] = [];
    const blooms: Shape[] = [];
    const count = random.int(3, 5);
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : i / (count - 1) - 0.5;
      const hx = vx + t * 34 + random.range(-3, 3);
      const hy = 14 + Math.abs(t) * 14 + random.range(0, 7);
      const petal = random.pick(PETALS);
      stems.push(Draw.line(vx + t * 4, 38, hx, hy + 3, 1, palette.foliage));
      for (let p = 0; p < 5; p += 1) {
        const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
        blooms.push(Draw.circle(hx + Math.cos(a) * 2.9, hy + Math.sin(a) * 2.9, 2.5, petal));
      }
      blooms.push(Draw.circle(hx, hy, 2, "#5a3a22"));
    }

    const dots: Shape[] = [];
    for (let i = 0; i < 5; i += 1) {
      const a = random.range(0.15, 0.85) * Math.PI;
      dots.push(Draw.circle(vx + Math.cos(a) * 9.5 * (i % 2 === 0 ? 1 : -1), 54 + Math.sin(a) * 12, random.range(1.2, 1.9), palette.paper, 0.85));
    }

    const parts: Part[] = [
      ...layer(0.4, window),
      ...layer(0.5, [Draw.polygon([[wx + 2, 64], [wx + 30, 64], [wx + 30 + (vx < 80 ? -56 : 56), 100], [wx + 2 + (vx < 80 ? -56 : 56), 100]], palette.glow, mood === "storm" ? 0.07 : 0.16)]),
      ...layer(0.8, [Draw.rect(-FLOOR_SPAN / 2, 74, FLOOR_SPAN * 1.5, 160, Draw.fade(palette.table, palette.ink))]),
      ...layer(1, [
        Draw.ellipse(vx + 4, 76, 18, 3, palette.ink, 0.3),
        ...stems,
        Draw.ellipse(vx, 74.5, 9, 2.2, ceramic),
        Draw.ellipse(vx, 60, 15, 16, ceramic),
        Draw.rect(vx - 5, 35, 10, 14, ceramic),
        Draw.ellipse(vx, 35.5, 6.4, 2, ceramic),
        Draw.ellipse(vx, 35.8, 4.6, 1.2, palette.ink, 0.45),
        Draw.ellipse(vx, 60, 15, 16, palette.ink, shade),
        ...dots,
        Draw.ellipse(vx - 7, 56, 2.4, 7, "#ffffff", 0.3),
        ...blooms,
      ]),
    ];
    return { sky: palette.wall, focus: { x: vx, y: 40 }, closeZoom: 1.8, parts };
  }
}

/** Picks the art for a subject; the switch is the one place that knows them all. */
export class SubjectArtFactory {
  public static for(subject: DiffusionSubject): SubjectArt {
    switch (subject) {
      case "lighthouse":
        return new LighthouseArt();
      case "vase":
        return new VaseArt();
      case "mountain":
        return new MountainArt();
      case "city":
        return new CityArt();
      default:
        return assertNever(subject);
    }
  }
}
