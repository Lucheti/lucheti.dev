import { BoxGeometry, Group, Mesh, MeshBasicMaterial, type BufferGeometry, type MeshToonMaterial } from "three";
import { CardPool } from "./CardPool";
import { ball, block, BUTTON_TARGET, drum, ignorePointer, IslandShadow, point, SolidMeshes, type Extent, type GroundShadow, type Point3, type ToonKit } from "./kit";
import type { Joint, OfficeLayout, Placed, RobotRig } from "./OfficeLayout";
import { CARD } from "./OfficeLayout";
import { OFFICE_LIGHT, PART, TONE } from "./palette";

type Disposable = Readonly<{ dispose: () => void }>;

/** One robot's moving parts. */
export type RobotParts = Readonly<{ root: Group; head: Group; eyes: Group; arms: readonly [Group, Group] }>;

/** One engineer's floating screen: its glass, which flickers, and its lines of code. */
export type ScreenParts = Readonly<{ glass: MeshToonMaterial; lines: readonly Group[] }>;

/** How many of each pooled thing the model holds. */
export type OfficeSizes = Readonly<{ cards: number; tray: number; puffs: number }>;

/**
 * The office island as three.js objects, built once from the layout: the still solids merged by tone, and
 * in groups of their own, placed at their pivots, every piece that moves: the button's cap, the robots
 * (their heads, eyes and arms), the stamp, the sketch's strokes, the magnifier, QA's lamps, the rocket and
 * its flame and smoke, the engineers' screens, and pools of ticket cards. An invisible hit box answers for
 * the button, and a soft tinted shadow lies under the plinth. The posers only move groups and change colours.
 */
export class OfficeModel {
  private readonly root = new Group();
  private readonly capGroup = new Group();
  private readonly stampGroup = new Group();
  private readonly magnifierGroup = new Group();
  private readonly rocketGroup = new Group();
  private readonly flameGroup = new Group();
  private readonly strokeGroups: Group[] = [];
  private readonly lampPaints: MeshToonMaterial[] = [];
  private readonly robotParts: RobotParts[] = [];
  private readonly screenParts: ScreenParts[] = [];
  private readonly puffGroups: Group[] = [];
  private readonly ticketPool: CardPool;
  private readonly trayPool: CardPool;
  private readonly meshes: SolidMeshes;
  private readonly owned: Disposable[] = [];

  public constructor(layout: OfficeLayout, kit: ToonKit, shadow: GroundShadow, sizes: OfficeSizes) {
    this.meshes = new SolidMeshes(kit);
    const origin = point(0, 0, 0);
    this.meshes.fill(this.root, layout.statics(), origin, true);

    const button = layout.button();
    this.meshes.fill(this.root, button.housing, origin, true);
    this.joint(this.root, this.capGroup, { pivot: button.cap.pivot, solids: button.cap.solids }, origin);
    this.root.add(this.hitBox(button.hit));

    const easel = layout.easel();
    const easelGroup = this.placed(easel);
    const props = layout.props();
    for (const stroke of props.easel.strokes) {
      const group = new Group();
      this.joint(easelGroup, group, stroke, origin);
      group.visible = false;
      this.strokeGroups.push(group);
    }

    for (const rig of layout.robots()) {
      this.robotParts.push(this.buildRobot(rig));
    }

    this.joint(this.root, this.stampGroup, props.stamp, origin);
    this.joint(this.root, this.magnifierGroup, props.magnifier, origin);
    const glass = kit.paint(TONE.glass);
    glass.transparent = true;
    glass.opacity = 0.45;
    glass.depthWrite = false;
    for (const lamp of props.lamps) {
      this.lampPaints.push(this.meshes.tinted(this.root, lamp.solids, origin, TONE.lamp));
    }
    this.joint(this.root, this.rocketGroup, props.rocket, origin);
    this.joint(this.rocketGroup, this.flameGroup, props.flame, props.rocket.pivot);
    this.flameGroup.visible = false;

    for (const screen of props.screens) {
      this.screenParts.push(this.screen(screen.glass, screen.lines));
    }

    const puff = this.meshes.geometry([ball(PART.smoke, TONE.smoke, origin, 1)], origin);
    for (let index = 0; index < sizes.puffs; index += 1) {
      this.puffGroups.push(this.puff(puff, kit));
    }

    const cardParts = {
      body: this.meshes.geometry([block(PART.ticket, TONE.card, origin, CARD, 0.03)], origin),
      stripe: this.meshes.geometry([block(PART.ticket, TONE.signal, point(0, CARD.y / 2 + 0.004, -CARD.z * 0.32), point(CARD.x * 0.86, 0.012, CARD.z * 0.18), 0.006)], origin),
      mark: this.meshes.geometry([drum(PART.ticket, TONE.signal, point(CARD.x * 0.22, CARD.y / 2 + 0.006, CARD.z * 0.12), 0.055, 0.055, 0.012)], origin),
      paint: () => kit.fresh(TONE.card),
      stripePaint: kit.paint(TONE.signal),
      markPaint: kit.paint(TONE.ink),
      outline: kit.outline(),
    };
    this.ticketPool = this.own(new CardPool(sizes.cards, { ...cardParts, halo: { color: OFFICE_LIGHT.halo, size: 1.3, opacity: 0.75 } }));
    this.trayPool = this.own(new CardPool(sizes.tray, { ...cardParts, halo: null }));
    this.root.add(this.ticketPool.object(), this.trayPool.object());

    const ground = this.own(new IslandShadow({ half: layout.half(), bottom: layout.bottom() }, shadow));
    this.root.add(ground.object());
  }

  /** The island's root, which turns as a whole. */
  public island(): Group {
    return this.root;
  }

  /** The button's cap, placed at its foot. */
  public cap(): Group {
    return this.capGroup;
  }

  /** Robot `index`'s moving parts, in the layout's order. */
  public robot(index: number): RobotParts {
    const parts = this.robotParts[index];
    if (parts === undefined) {
      throw new Error(`No robot ${index}`);
    }
    return parts;
  }

  public stamp(): Group {
    return this.stampGroup;
  }

  public magnifier(): Group {
    return this.magnifierGroup;
  }

  public rocket(): Group {
    return this.rocketGroup;
  }

  public flame(): Group {
    return this.flameGroup;
  }

  /** The sketch's strokes, in the order they are drawn. */
  public strokes(): readonly Group[] {
    return this.strokeGroups;
  }

  /** QA's lamps' materials, top to bottom: red, amber, green. */
  public lamps(): readonly MeshToonMaterial[] {
    return this.lampPaints;
  }

  public screens(): readonly ScreenParts[] {
    return this.screenParts;
  }

  public puffs(): readonly Group[] {
    return this.puffGroups;
  }

  /** The tickets on their way. */
  public tickets(): CardPool {
    return this.ticketPool;
  }

  /** The ideas waiting in the inbox tray. */
  public tray(): CardPool {
    return this.trayPool;
  }

  /** Frees every geometry and material made here (the kit frees its own). */
  public dispose(): void {
    this.meshes.dispose();
    this.owned.forEach((item) => item.dispose());
    this.owned.length = 0;
  }

  /** A group of solids modelled about its own origin, placed and turned on the island. */
  private placed(piece: Placed): Group {
    const group = new Group();
    group.position.set(piece.at.x, piece.at.y, piece.at.z);
    group.rotation.y = piece.yaw;
    this.meshes.fill(group, piece.solids, point(0, 0, 0), true);
    this.root.add(group);
    return group;
  }

  /** Fills `group` with `joint`'s solids about its pivot, and hangs it in `parent` at the pivot, relative to `origin`. */
  private joint(parent: Group, group: Group, joint: Joint, origin: Point3): void {
    group.position.set(joint.pivot.x - origin.x, joint.pivot.y - origin.y, joint.pivot.z - origin.z);
    this.meshes.fill(group, joint.solids, joint.pivot, true);
    parent.add(group);
  }

  private buildRobot(rig: RobotRig): RobotParts {
    const origin = point(0, 0, 0);
    const root = this.placed({ at: rig.at, yaw: rig.yaw, solids: rig.body });
    const head = new Group();
    this.joint(root, head, rig.head, origin);
    const eyes = new Group();
    this.joint(head, eyes, rig.eyes, rig.head.pivot);
    const left = new Group();
    const right = new Group();
    this.joint(root, left, rig.arms[0], origin);
    this.joint(root, right, rig.arms[1], origin);
    return { root, head, eyes, arms: [left, right] };
  }

  /** An engineer's screen: its glass in a see-through material of its own, and each line of code in a group. */
  private screen(glass: Placed, lines: readonly Placed[]): ScreenParts {
    const group = new Group();
    group.position.set(glass.at.x, glass.at.y, glass.at.z);
    this.root.add(group);
    const paint = this.meshes.tinted(group, glass.solids.slice(0, 1), point(0, 0, 0), TONE.holo);
    paint.transparent = true;
    paint.opacity = 0.7;
    paint.depthWrite = false;
    this.meshes.fill(group, glass.solids.slice(1), point(0, 0, 0), false);
    const lineGroups = lines.map((line) => {
      const lineGroup = new Group();
      this.meshes.fill(lineGroup, line.solids, point(0, 0, 0), false);
      group.add(lineGroup);
      return lineGroup;
    });
    return { glass: paint, lines: lineGroups };
  }

  /** One smoke puff, a unit ball scaled into size by the poser; hidden until the rocket fires. */
  private puff(geometry: BufferGeometry, kit: ToonKit): Group {
    const group = new Group();
    const body = new Mesh(geometry, kit.paint(TONE.smoke));
    const hull = new Mesh(geometry, kit.outline());
    [body, hull].forEach(ignorePointer);
    group.add(body, hull);
    group.visible = false;
    this.root.add(group);
    return group;
  }

  /** An invisible box round `extent` that answers to the pointer as the button. */
  private hitBox(extent: Extent): Mesh {
    const { min, max } = extent;
    const geometry = this.own(new BoxGeometry(max.x - min.x, max.y - min.y, max.z - min.z));
    const mesh = new Mesh(geometry, this.own(new MeshBasicMaterial({ visible: false })));
    mesh.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
    mesh.userData.target = BUTTON_TARGET;
    return mesh;
  }

  private own<T extends Disposable>(item: T): T {
    this.owned.push(item);
    return item;
  }
}
