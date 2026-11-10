# Portfolio build spec

Personal portfolio for Lucas Garcia, positioned as a **Product Engineer** who uses AI agents to automate delivery.

## Concept

The page is one continuous scroll. A single 3D object, "the artifact", starts as scattered fragments and assembles
itself as the reader scrolls, wired together by thin lime threads. Behind it, a video of a camera gliding into a
network of lime threads is scrubbed by the same scroll. Idea → shipped, in one image.

## Layers

`src/app/page.tsx` is the composition root. It stacks three layers inside `<StoryProvider>`:

| z | Layer | Owner | Notes |
|---|---|---|---|
| 0 | `<Backdrop manifest>` | `src/backdrop` | fixed, full viewport, canvas drawing video frames |
| 10 | `<ArtifactStage />` | `src/artifact` | fixed, full viewport, transparent WebGL canvas |
| 20 | `<Sections content>` | `src/sections`, `src/ui` | normal document flow; the only layer that takes pointer events |
| 30 | nav | `src/sections` | fixed |

Layers 0 and 10 are `aria-hidden`, `pointer-events-none`, and must never block text selection or links.

## Shared contracts (already written, do not change)

Import everything from `@/story` and `@/content`. Do not edit those directories, `src/app`, or config files. If a
contract is wrong or missing something, say so in your final report instead of changing it.

```ts
import { useStory, useActiveChapter, Chapter, Progress, ChapterPosition, CHAPTER_IDS, type ChapterId } from "@/story";

const story = useStory();
story.page().current();          // Progress, 0 → 1 over the whole document
story.page().subscribe(fn);      // returns an unsubscribe function
story.chapters().current();      // ChapterPosition
position.chapter();              // "hero" | "method" | "work" | "lab" | "contact"
position.upcoming();             // the chapter being approached
position.blend();                // Progress from chapter() toward upcoming()
progress.toNumber(); progress.within(0.2, 0.6); progress.eased(); progress.mix(a, b);
```

- Read `current()` inside animation loops (`requestAnimationFrame`, R3F `useFrame`). Never put scroll values in
  React state; nothing should re-render per scroll event.
- `<Chapter id="work">` renders a `<section id="work">` and registers it with the story. Every chapter id must be
  rendered exactly once, in `CHAPTER_IDS` order.
- `useActiveChapter()` re-renders only when the reader crosses into another chapter (for the nav).
- All copy lives in `src/content/site.ts` and arrives through props. Never hard-code copy in components.

## Design language

Dark, quiet, precise. Near-black ink, warm bone type, **one** accent: electric lime. No gradients of other hues, no
purple or blue, no drop shadows, no emoji, no stock icons. The lime is rare: accents, one word of the headline,
active states, thin lines. If lime covers more than about 5% of a screen, there is too much of it.

Tokens are defined in `src/app/globals.css` and exposed as Tailwind v4 utilities:

| Utility | Value | Use |
|---|---|---|
| `bg-ink` | `#060706` | page background |
| `bg-ink-raised` | `#0d0f0d` | solid panels |
| `bg-ink-glass` | ink at 62% | panels over the backdrop, with `backdrop-blur-md` |
| `text-bone` | `#ecebe3` | primary text |
| `text-bone-dim` | `#a4a69d` | secondary text |
| `text-bone-faint` | `#6f716a` | metadata only, never body text |
| `border-line` / `border-line-strong` | bone at 10% / 22% | hairlines |
| `text-lime` / `bg-lime` | `#c5f82a` | the accent |
| `font-display` | Bricolage Grotesque | headlines |
| `font-sans` | Geist | body |
| `font-mono` | Geist Mono | labels, metadata, numbers |
| `ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | the house easing |

Type: headlines are `font-display`, weight 600, tight tracking (`-0.03em` to `-0.045em`), leading 0.9–1.0. Labels
are `font-mono`, 11–12px, uppercase, tracking `0.14em`. Body is 16–18px, leading 1.6, max width about 34rem.

Motion: things arrive once and stay. Durations 0.6–1.0s with the house easing, staggers of 60–90ms, travel of
16–32px. Nothing bounces, nothing loops for decoration except the artifact and the Orchestra pipeline pulse.
Everything respects `prefers-reduced-motion`.

## Coding rules

- TypeScript strict. No `any`, no non-null `!` unless a comment proves it safe.
- When data varies use a discriminated union; when behaviour varies use an interface. A `switch` over a union ends
  in an `assertNever` default.
- A class must guard a rule or own behaviour. A value with no rule is a type alias. Entities are `Readonly` types.
- Class fields are `private` (or `protected`) and `readonly` where possible; every member has an explicit
  visibility modifier. No generic setters; mutate through named domain methods.
- Nothing is instantiated at module load. Construct objects inside components (`useState(() => new X())`,
  `useMemo`) or inside the classes that own them.
- Keep pure logic (maths, sequencing, layout) in plain classes or functions with unit tests (`*.test.ts`, vitest,
  node environment, no DOM). Components stay thin.
- No per-frame allocations in animation loops: reuse vectors, quaternions and arrays.
- Client components only where needed (`"use client"`). No new dependencies without saying so in your report.
- Comments explain why, not what. No commented-out code, no TODOs.

## WP-A — Backdrop (`src/backdrop/**`)

A scroll-scrubbed image sequence on a 2D canvas, Apple-product-page style.

- `Backdrop({ manifest })` keeps its current signature. Root: `fixed inset-0 z-0 pointer-events-none`,
  `aria-hidden`.
- Frames are `{set.directory}/{0001…NNNN}.webp`, four-digit, 1-based, `manifest.frameCount` of them.
- Pick the smallest set whose width covers `viewport width × min(devicePixelRatio, 2)`, else the largest.
- Loading: first frame immediately; then a coarse pass (every 8th frame); then the rest, at most 6 requests in
  flight, without blocking first paint. If the wanted frame is not loaded yet, draw the nearest loaded one. The
  canvas is never blank once the first frame has arrived.
- Frame position is `story.page()` mapped across all frames. Draw the floor frame, then the next frame on top with
  `globalAlpha` equal to the fractional part, so scrubbing looks continuous rather than stepped.
- Ease the displayed position toward the target each animation frame (about 12% of the remaining distance) so the
  scrub has inertia. Only repaint when something changed (position, a newly loaded frame, a resize); do not run a
  permanent 60fps loop when idle.
- Cover-fit the frame to the canvas with focal point x = 62%, y = 50%, so the bright core stays visible on portrait
  screens. Canvas backing store follows the element size × `min(devicePixelRatio, 2)` via `ResizeObserver`.
- On top of the canvas, in CSS: a left-to-right scrim (`ink` at about 70% on the left edge fading to transparent
  by 60% width) for text legibility, a soft vignette, a bottom fade to `ink` (last 20% of height), and a very faint
  static grain (inline SVG noise, opacity ≤ 0.06). On screens narrower than `lg`, add a uniform `ink` veil at about
  45% so text is readable over the centre of the frame.
- Reduced motion: draw one still frame (35% through the sequence) and do not scrub.
- Unit tests: frame-position maths (floor, next, mix, clamping at the ends), set selection, cover-fit rectangle,
  nearest-loaded lookup.

## WP-B — Artifact (`src/artifact/**`)

The 3D object, with react-three-fiber. **No postprocessing** (the canvas must stay transparent over the backdrop);
glow is done with additive sprites.

- `ArtifactStage()` keeps its current signature. Root: `fixed inset-0 z-10 pointer-events-none`, `aria-hidden`,
  `opacity-60 lg:opacity-100`. Load the scene with `next/dynamic` and `ssr: false` from a client component.
  `<Canvas dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }}>`, perspective camera, fov 35, on the +z axis
  looking at the origin.
- **Shards.** Start from an icosahedron (radius 1, detail 0): 20 triangular faces. Each face becomes one shard: the
  face triangle shrunk 6% toward its centroid, extruded inward to 58% of the radius, so the assembled object is a
  faceted shell with hairline seams and a hollow core. Flat shaded. `MeshStandardMaterial`, colour `#1c1e1b`,
  roughness 0.85, metalness 0.1. It should read as matte charcoal ceramic.
- **Assembly** is a `Progress`. At 0 every shard is scattered: pushed 0.45–1.2 radii out along its face normal with
  slight sideways jitter (the cloud reads as one unfinished object, about twice the assembled size), and rotated up to about 1.2 rad around a random axis. At 1 every shard is exactly home. Each
  shard has its own window inside the assembly (staggered starts, each about 45% long, eased) so they arrive in
  sequence rather than all at once. Scatter values come from a seeded PRNG so the layout is identical every load.
- **Idle life.** Scattered shards drift slightly (slow sine bob and wobble), scaled by `1 − assembly` so the
  finished object is still. The whole object turns slowly (about 0.05 rad/s) on top of the pose's spin.
- **Threads.** The icosahedron has 30 edges; each joins two neighbouring faces. Draw one lime line between the
  centroids of each neighbouring pair of shards, updated every frame. Additive blending, colour `#c5f82a`. Opacity
  about 0.55 while scattered, fading to about 0.12 when assembled.
- **Nodes.** About 18 small bright dots travelling along the threads at different speeds and phases, each with an
  additive radial-gradient sprite for glow (generate the texture on a small canvas, once).
- **Core and seams.** A lime emissive sphere at the centre plus a lime point light. Both grow with assembly (light
  intensity from about 2 to about 14); the sphere stays a spark while scattered and swells to nearly fill the
  hollow shell at the end. Lime hairlines along the 30 shell edges fade in over the last tenth of the assembly, so
  the threads visibly hand over to glowing seams. Add a large, faint additive
  glow sprite behind the object that also grows with assembly.
- **Lighting.** Very low ambient; a dim neutral key light from the upper left; a lime point light below and in
  front for the underlighting seen in the reference. Shards must not look grey or flat-lit.
- **Pose** follows `story.chapters()`. Interpolate between the pose of `chapter()` and the pose of `upcoming()` by
  `blend().eased()`, then damp toward that target every frame (`THREE.MathUtils.damp`, lambda about 4).

  | Chapter | anchor x, y (viewport fraction) | scale | assembly | spin (rad) |
  |---|---|---|---|---|
  | hero | 0.74, 0.50 | 0.85 | 0.00 | 0.0 |
  | method | 0.77, 0.52 | 0.90 | 0.35 | 0.7 |
  | work | 0.86, 0.46 | 0.72 | 0.68 | 1.5 |
  | lab | 0.75, 0.50 | 0.95 | 0.90 | 2.3 |
  | contact | 0.76, 0.47 | 1.05 | 1.00 | 3.1 |

  The contact pose rests the finished object on the bright core of the backdrop's final frames.

  Anchor is where the object's centre sits on screen: convert to world units on the z = 0 plane with R3F's
  `viewport` (`x = (ax − 0.5) × viewport.width`, `y = (0.5 − ay) × viewport.height`). At scale 1 the assembled
  object's diameter is 42% of the viewport height, and never more than 70% of the viewport width.
  When the canvas is narrower than 1024 CSS px, use a second table: every chapter anchored at x 0.5, y 0.26,
  scales 0.62 of the above, same assembly and spin. The stage is `opacity-40` below `lg`.
- **Interaction.** The object leans toward the pointer: listen to `pointermove` on `window`, normalise to −1…1,
  and damp a tilt of up to ±0.22 rad (x) and ±0.32 rad (y). Scattered shards also part slightly from the pointer.
  Ignore touch pointers.
- **Reduced motion.** No idle drift, no slow turn, no pointer lean, no travelling nodes. The pose still follows
  the chapters (that motion is driven by the reader).
- Pause rendering when the tab is hidden. No per-frame allocations.
- Structure: pure classes for the shard geometry and scatter (`ShardField`), the per-shard transform at a given
  assembly and time (`AssemblyChoreography`), and pose interpolation (`PoseTrack`); thin R3F components on top.
- Unit tests: 20 shards and 30 neighbour pairs; assembly 1 puts every shard exactly home; assembly 0 puts every
  shard at least 1.2 radii out; pose interpolation at chapter boundaries and midpoints; the narrow table is chosen
  below 1024.

## WP-C — Sections (`src/sections/**`, `src/ui/**`)

Everything the reader reads. Uses `motion/react` for animation.

- `Sections({ content })` keeps its current signature and renders: skip link, fixed nav, `<main class="relative
  z-20">` with five `<Chapter>`s in order (hero, method, work, lab, contact), and the footnote.
- **Layout.** Container `max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16`. From `lg` up, the artifact owns the right
  side of the screen, so every chapter keeps its content in the **left 56%** of the container.
  Contact is a full-height section with its content vertically centred in that column.
  Below `lg` everything is a single full-width column. Chapters breathe: `py-28 lg:py-44`; hero and contact are
  `min-h-dvh`.
- **Nav.** Name on the left (`font-display`), chapter links on the right (`font-mono` labels). The active chapter
  (from `useActiveChapter()`) gets bone text and a small lime dot; others are `text-bone-dim`. Transparent over
  the hero, `bg-ink-glass backdrop-blur-md` with a bottom hairline once past it. Below `md`, show the name and the
  Contact link only. Links are plain `#chapter` anchors (smooth scrolling is already handled).
- **Hero.** Eyebrow label; `<h1>` with one block per headline line at `clamp(3.5rem, 11vw, 10rem)`, the last line
  in lime; lede in `text-bone-dim`; primary button (lime pill, ink text) and secondary button (hairline pill);
  the facts as a three-column mono row pinned near the bottom with a hairline above; a small "Scroll" cue.
  Entrance: each headline line rises from behind a mask (y 110% → 0, 0.9s, house easing, 80ms stagger); the rest
  fade up after it.
- **Method.** Label, `<h2>`, intro, then the four steps as a vertical list with a hairline rail on the left. A lime
  line fills the rail as the reader scrolls through the list (`useScroll` with the list as target, `scaleY`). Each
  step: large mono number in `text-bone-faint`, title (`<h3>`, display), claim in bone at about 20px, proof in
  `text-bone-dim`, and the source as a small mono chip. Steps reveal as they enter the viewport.
- **Work.** Label, `<h2>`, intro, then one card per case study, stacked. Card: `bg-ink-glass backdrop-blur-md
  border border-line rounded-2xl`, generous padding. Top row: company (`font-display`, large) and period (mono).
  Then role (mono, dim), headline (`<h3>`), summary, highlights as a list with small lime square markers, and tags
  as hairline chips. On hover the border goes `line-strong` and a 1px lime line draws across the top edge.
- **Lab.** Label, `<h2>`, intro. The featured project is a large card with a pipeline diagram: six stages
  (`Idea`, `PRD`, `Cards`, `Review`, `QA`, `Release`) as small nodes on a hairline, with a lime pulse travelling
  from left to right on a loop and each node lighting as the pulse passes (static, all lit, under reduced motion).
  The stage names are presentation detail and may live in the component. The other projects sit in a two-column
  grid of smaller cards below it. A project with no highlights simply shows none.
- **Contact.** Label, very large `<h2>` (`clamp(2.75rem, 7vw, 6.5rem)`), body, link buttons (external links get
  `target="_blank" rel="noopener noreferrer"`), and the footnote in `text-bone-faint` at the bottom.
- **Reveals.** One shared `Reveal` component in `src/ui` (fade + 24px rise, `whileInView`, `once: true`, margin
  `-10% 0px`). Wrap the tree in `<MotionConfig reducedMotion="user">`.
- **Accessibility.** One `<h1>`; `<h2>` per chapter; `<h3>` for items. Visible focus states (already global).
  Text over the backdrop must stay readable: use `text-bone` or `text-bone-dim`, never `text-bone-faint`, for
  sentences.
- Server components by default; `"use client"` only for files that animate or read the story.
- Unit tests are not required here, but the gate must pass.

## Gate

`pnpm gate` runs typecheck, lint, tests and a production build. It must pass before you commit. Do not start a
dev server; visual review happens at integration.
