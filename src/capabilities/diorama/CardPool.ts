import { CanvasTexture, Group, LinearFilter, Mesh, SRGBColorSpace, Sprite, SpriteMaterial, type BufferGeometry, type Material, type MeshToonMaterial } from "three";
import { ignorePointer, type Point3 } from "./kit";

/** What a card is made of: its body (in a material of its own, so it can blush red), stripe, stamp and outline. */
export type CardParts = Readonly<{
  body: BufferGeometry;
  stripe: BufferGeometry;
  mark: BufferGeometry;
  /** Makes a fresh body material for each card. */
  paint: () => MeshToonMaterial;
  stripePaint: Material;
  markPaint: Material;
  outline: Material;
  /** The soft glow behind a card, or null for cards that do not glow. */
  halo: Readonly<{ color: string; size: number; opacity: number }> | null;
}>;

/** How a card is drawn this frame. */
export type CardDraw = Readonly<{
  at: Point3;
  scale: number;
  /** 0 standing up, 1 lying flat. */
  flat: number;
  spin: number;
  stamped: boolean;
  /** The body's colour and glow. */
  color: string;
  glow: string;
}>;

type Card = Readonly<{ group: Group; body: MeshToonMaterial; mark: Mesh; halo: Sprite | null }>;

/** Texels across the halo's texture. */
const HALO_TEXELS = 64;

/**
 * A fixed pool of ticket cards in one group: each frame the poser places as many as it needs and the rest
 * are hidden. A card is modelled lying flat; it stands up by tipping about its own width, and turns about
 * the upright. Glowing cards carry a soft halo that always faces the camera. Nothing is made after the start.
 */
export class CardPool {
  private readonly root = new Group();
  private readonly cards: readonly Card[];
  private readonly haloMap: CanvasTexture | null;
  private readonly haloSize: number;
  private readonly owned: Array<Readonly<{ dispose: () => void }>> = [];
  private used = 0;

  public constructor(size: number, parts: CardParts) {
    if (!Number.isInteger(size) || size < 1) {
      throw new Error(`A card pool needs at least one card: ${size}`);
    }
    this.haloSize = parts.halo?.size ?? 0;
    this.haloMap = parts.halo === null ? null : this.own(this.haloTexture());
    this.cards = Array.from({ length: size }, () => {
      const group = new Group();
      group.rotation.order = "YXZ";
      const body = this.own(parts.paint());
      const meshes = [new Mesh(parts.body, body), new Mesh(parts.stripe, parts.stripePaint), new Mesh(parts.body, parts.outline)];
      const mark = new Mesh(parts.mark, parts.markPaint);
      [...meshes, mark].forEach(ignorePointer);
      group.add(...meshes, mark);
      let halo: Sprite | null = null;
      if (parts.halo !== null && this.haloMap !== null) {
        const material = this.own(
          new SpriteMaterial({ map: this.haloMap, color: parts.halo.color, transparent: true, opacity: parts.halo.opacity, depthWrite: false }),
        );
        halo = new Sprite(material);
        halo.renderOrder = 1;
        ignorePointer(halo);
      }
      group.visible = false;
      this.root.add(group);
      if (halo !== null) {
        halo.visible = false;
        this.root.add(halo);
      }
      return { group, body, mark, halo };
    });
  }

  /** The group the pool's cards live in. */
  public object(): Group {
    return this.root;
  }

  /** Starts a frame: every card is free again. */
  public begin(): void {
    this.used = 0;
  }

  /** Puts the next free card where `draw` says. Returns false once the pool is used up. */
  public place(draw: CardDraw): boolean {
    const card = this.cards[this.used];
    if (card === undefined) {
      return false;
    }
    this.used += 1;
    card.group.visible = draw.scale > 0.01;
    card.group.position.set(draw.at.x, draw.at.y, draw.at.z);
    card.group.rotation.set((1 - draw.flat) * (Math.PI / 2), draw.spin, 0);
    card.group.scale.setScalar(Math.max(0.001, draw.scale));
    card.mark.visible = draw.stamped;
    card.body.color.set(draw.color);
    card.body.emissive.set(draw.glow);
    if (card.halo !== null) {
      card.halo.visible = card.group.visible;
      card.halo.position.copy(card.group.position);
      card.halo.scale.setScalar(this.haloSize * draw.scale);
    }
    return true;
  }

  /** Ends a frame: hides every card not placed in it. */
  public end(): void {
    for (let index = this.used; index < this.cards.length; index += 1) {
      this.cards[index].group.visible = false;
      const halo = this.cards[index].halo;
      if (halo !== null) {
        halo.visible = false;
      }
    }
  }

  /** Frees the materials and texture made here (the geometry belongs to the model). */
  public dispose(): void {
    this.owned.forEach((item) => item.dispose());
    this.owned.length = 0;
  }

  /** A soft round glow, white in the middle and fading to nothing, tinted by each sprite's colour. */
  private haloTexture(): CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = HALO_TEXELS;
    canvas.height = HALO_TEXELS;
    const context = canvas.getContext("2d");
    if (context !== null) {
      const middle = HALO_TEXELS / 2;
      const gradient = context.createRadialGradient(middle, middle, 0, middle, middle, middle);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, HALO_TEXELS, HALO_TEXELS);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  }

  private own<T extends Readonly<{ dispose: () => void }>>(item: T): T {
    this.owned.push(item);
    return item;
  }
}
