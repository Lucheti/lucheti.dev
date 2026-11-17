import {
  BufferAttribute,
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  Path,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { assertNever } from "./assertNever";
import type { CardBlueprint, LayerSpec, Mark, Tone, Weight } from "./CardBlueprint";
import { SHADOW_SHIFT, SHADOW_SOFTNESS } from "./FallbackSketch";
import type { Vec3 } from "./IsometricView";
import { roundedBox, type Outline } from "./outline";
import { SHADOW, SURFACES, TONES, WEIGHTS, type SlabPaint } from "./palette";

/** Each mark sits this far above the one before it, so overlapping marks never fight for the same depth. */
const MARK_STEP = 0.0015;
/** Draw order inside a layer; layers draw bottom to top, `LAYER_STRIDE` apart, so glass washes what is under it. */
const LAYER_STRIDE = 10;
const ORDER = { slab: 0, fills: 1, lines: 2, ripple: 3 } as const;
/** The shadow's texture resolution, in texels per model unit: it is blurred, so this is plenty. */
const SHADOW_TEXELS = 96;
/** How far the shadow's plane reaches past the card, in model units, so its blur fades out inside the plane. */
const SHADOW_MARGIN = 0.55;
const RING_SEGMENTS = 64;

type Disposable = Readonly<{ dispose: () => void }>;

/** One ripple ring: its mesh and the material whose opacity fades it. */
type RippleRing = Readonly<{ mesh: Mesh; material: MeshBasicMaterial }>;

/**
 * The stack as three.js objects, built once from the blueprint: per layer a slab (vertex-coloured, so its
 * walls are lit on one side and shaded on the other without any lights), its filled marks merged into one
 * mesh per tone, its hairlines merged into one screen-space line set per tone and weight, and the ripple
 * rings. The scene only moves groups and fades rings; nothing is rebuilt after construction.
 */
export class StackMeshes {
  private readonly root = new Group();
  private readonly layers: Group[] = [];
  private readonly rings: RippleRing[] = [];
  private readonly lineMaterials: LineMaterial[] = [];
  private readonly owned: Disposable[] = [];
  private readonly upAxis = new Vector3(0, 1, 0);
  private readonly tiltAxis: Vector3;
  private readonly yawTurn = new Quaternion();
  private readonly tiltTurn = new Quaternion();

  public constructor(blueprint: CardBlueprint, ripples: number, tiltAxis: Readonly<Vec3>) {
    this.tiltAxis = new Vector3(tiltAxis.x, tiltAxis.y, tiltAxis.z).normalize();
    const slab = blueprint.slab();
    blueprint.layers().forEach((spec, index) => {
      const group = new Group();
      this.buildSlab(group, spec, slab, index);
      this.buildMarks(group, spec, index, ripples);
      if (index === 0) {
        this.buildShadow(group, blueprint);
      }
      this.layers.push(group);
      this.root.add(group);
    });
  }

  /** The object to put in the scene. */
  public object(): Group {
    return this.root;
  }

  /** Turns the whole model by `yaw` about the vertical axis, then `tilt` about the screen's right axis. */
  public orient(yaw: number, tilt: number): void {
    this.yawTurn.setFromAxisAngle(this.upAxis, yaw);
    this.tiltTurn.setFromAxisAngle(this.tiltAxis, tilt);
    this.root.quaternion.multiplyQuaternions(this.tiltTurn, this.yawTurn);
  }

  /** Raises layer `index`'s base to `height`. */
  public lift(index: number, height: number): void {
    this.layers[index].position.y = height;
  }

  /** How many ripple rings there are. */
  public ripples(): number {
    return this.rings.length;
  }

  /** Sizes and fades ripple ring `ring`. */
  public ripple(ring: number, scale: number, opacity: number): void {
    const { mesh, material } = this.rings[ring];
    mesh.scale.set(scale, 1, scale);
    material.opacity = opacity;
    mesh.visible = opacity > 0.002;
  }

  /** Screen-space hairlines need the canvas size in CSS pixels to stay one pixel wide. */
  public resize(width: number, height: number): void {
    for (const material of this.lineMaterials) {
      material.resolution.set(width, height);
    }
  }

  /** Frees every geometry, material and texture made here. */
  public dispose(): void {
    for (const item of this.owned) {
      item.dispose();
    }
    this.owned.length = 0;
  }

  private buildSlab(group: Group, spec: LayerSpec, outline: Outline, index: number): void {
    const paint = SURFACES[spec.surface];
    const geometry = new ExtrudeGeometry(StackMeshes.shape(outline), { depth: spec.thickness, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    StackMeshes.paintSlab(geometry, paint);
    const glass = paint.topOpacity < 1;
    const caps = this.own(new MeshBasicMaterial({ vertexColors: true, transparent: glass, opacity: paint.topOpacity, depthWrite: !glass }));
    const walls = this.own(new MeshBasicMaterial({ vertexColors: true, transparent: glass, opacity: paint.wallOpacity, depthWrite: !glass }));
    const mesh = new Mesh(this.own(geometry), [caps, walls]);
    mesh.renderOrder = index * LAYER_STRIDE + ORDER.slab;
    group.add(mesh);
    this.addLines(group, [[outline, true]], spec.thickness + MARK_STEP / 2, "ink", paint.edge, index);
  }

  private buildMarks(group: Group, spec: LayerSpec, index: number, ripples: number): void {
    const fills = new Map<Tone, BufferGeometry[]>();
    const strokes = new Map<string, { tone: Tone; weight: Weight; height: number; paths: [Outline, boolean][] }>();
    spec.marks.forEach((mark: Mark, order) => {
      const height = spec.thickness + MARK_STEP * (order + 1);
      switch (mark.kind) {
        case "fill": {
          const geometry = new ShapeGeometry(StackMeshes.shape(mark.outline, mark.hole));
          geometry.rotateX(-Math.PI / 2);
          geometry.translate(0, height, 0);
          fills.set(mark.tone, [...(fills.get(mark.tone) ?? []), geometry]);
          break;
        }
        case "stroke": {
          const key = `${mark.tone}:${mark.weight}`;
          const bucket = strokes.get(key) ?? { tone: mark.tone, weight: mark.weight, height, paths: [] };
          bucket.height = Math.max(bucket.height, height);
          bucket.paths.push([mark.path, mark.closed]);
          strokes.set(key, bucket);
          break;
        }
        case "ripple":
          this.buildRipple(group, mark, height, index, ripples);
          break;
        default:
          assertNever(mark);
      }
    });
    fills.forEach((parts, tone) => {
      const merged = mergeGeometries(parts);
      parts.forEach((part) => part.dispose());
      if (merged === null) {
        throw new Error(`The ${tone} marks of the ${spec.kind} layer could not be merged`);
      }
      const mesh = new Mesh(this.own(merged), this.own(new MeshBasicMaterial({ color: TONES[tone] })));
      mesh.renderOrder = index * LAYER_STRIDE + ORDER.fills;
      group.add(mesh);
    });
    strokes.forEach((bucket) => this.addLines(group, bucket.paths, bucket.height, bucket.tone, bucket.weight, index));
  }

  private buildRipple(group: Group, mark: Extract<Mark, { kind: "ripple" }>, height: number, index: number, ripples: number): void {
    const geometry = this.own(new RingGeometry(mark.radius - mark.width / 2, mark.radius + mark.width / 2, RING_SEGMENTS));
    geometry.rotateX(-Math.PI / 2);
    for (let ring = 0; ring < ripples; ring += 1) {
      const material = this.own(new MeshBasicMaterial({ color: TONES[mark.tone], transparent: true, opacity: 0, depthWrite: false }));
      const mesh = new Mesh(geometry, material);
      mesh.position.set(mark.centre.u, height, mark.centre.v);
      mesh.renderOrder = index * LAYER_STRIDE + ORDER.ripple;
      group.add(mesh);
      this.rings.push({ mesh, material });
    }
  }

  /** A soft shadow under the bottom slab, a little toward the viewer, drawn once into a blurred texture. */
  private buildShadow(group: Group, blueprint: CardBlueprint): void {
    const { width, depth, radius } = blueprint.footprint();
    const planeWidth = width + 2 * SHADOW_MARGIN;
    const planeDepth = depth + 2 * SHADOW_MARGIN;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(planeWidth * SHADOW_TEXELS);
    canvas.height = Math.round(planeDepth * SHADOW_TEXELS);
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }
    // Draw the card far off the canvas and let only its shadow land on it: a blur every browser supports.
    const away = canvas.width * 4;
    context.shadowColor = "#000000";
    context.shadowBlur = SHADOW_SOFTNESS * 2 * SHADOW_TEXELS;
    context.shadowOffsetX = away;
    context.fillStyle = "#000000";
    context.beginPath();
    const card = roundedBox(
      { left: SHADOW_MARGIN, top: SHADOW_MARGIN, right: SHADOW_MARGIN + width, bottom: SHADOW_MARGIN + depth },
      radius,
    );
    card.forEach((point, index) => {
      const x = point.u * SHADOW_TEXELS - away;
      const y = point.v * SHADOW_TEXELS;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    context.closePath();
    context.fill();
    const texture = this.own(new CanvasTexture(canvas));
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    const geometry = this.own(new PlaneGeometry(planeWidth, planeDepth));
    geometry.rotateX(-Math.PI / 2);
    const material = this.own(
      new MeshBasicMaterial({ color: SHADOW.color, map: texture, transparent: true, opacity: SHADOW.opacity, depthWrite: false }),
    );
    const mesh = new Mesh(geometry, material);
    mesh.position.set(SHADOW_SHIFT, -MARK_STEP, SHADOW_SHIFT);
    mesh.renderOrder = -1;
    group.add(mesh);
  }

  private addLines(group: Group, paths: readonly (readonly [Outline, boolean])[], height: number, tone: Tone, weight: Weight, index: number): void {
    const positions: number[] = [];
    for (const [path, closed] of paths) {
      const last = closed ? path.length : path.length - 1;
      for (let step = 0; step < last; step += 1) {
        const from = path[step];
        const to = path[(step + 1) % path.length];
        positions.push(from.u, height, from.v, to.u, height, to.v);
      }
    }
    const geometry = this.own(new LineSegmentsGeometry());
    geometry.setPositions(positions);
    const material = this.own(
      new LineMaterial({ color: TONES[tone], linewidth: 1, transparent: true, opacity: WEIGHTS[weight], depthWrite: false }),
    );
    this.lineMaterials.push(material);
    const lines = new LineSegments2(geometry, material);
    lines.renderOrder = index * LAYER_STRIDE + ORDER.lines;
    group.add(lines);
  }

  private own<T extends Disposable>(item: T): T {
    this.owned.push(item);
    return item;
  }

  /** A three.js shape of a loop on the card's plane. Shapes live in x/y; after the flat turn, −y becomes +z, so v is negated. */
  private static shape(outline: Outline, hole?: Outline): Shape {
    const shape = new Shape(outline.map((point) => new Vector2(point.u, -point.v)));
    if (hole !== undefined) {
      shape.holes.push(new Path(hole.map((point) => new Vector2(point.u, -point.v))));
    }
    return shape;
  }

  /**
   * Bakes the slab's light into vertex colours: the top in its paint, the walls from lit (facing the viewer's
   * left) to shaded (facing the right), by their normal. No lights, so colours land exactly as specified.
   */
  private static paintSlab(geometry: BufferGeometry, paint: SlabPaint): void {
    const normals = geometry.getAttribute("normal");
    const top = new Color(paint.top);
    const lit = new Color(paint.wallLit);
    const shade = new Color(paint.wallShade);
    const colour = new Color();
    const colours = new Float32Array(normals.count * 3);
    for (let vertex = 0; vertex < normals.count; vertex += 1) {
      const nx = normals.getX(vertex);
      const ny = normals.getY(vertex);
      const nz = normals.getZ(vertex);
      if (Math.abs(ny) > 0.5) {
        colour.copy(top);
      } else {
        const towardShade = Math.min(1, Math.max(0, 0.5 + (nx - nz) * 0.5 * Math.SQRT1_2));
        colour.lerpColors(lit, shade, towardShade);
      }
      colours[vertex * 3] = colour.r;
      colours[vertex * 3 + 1] = colour.g;
      colours[vertex * 3 + 2] = colour.b;
    }
    geometry.setAttribute("color", new BufferAttribute(colours, 3));
  }
}
