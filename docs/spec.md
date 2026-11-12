# Portfolio build spec — v2 "Spec sheet"

Personal portfolio and CV for Lucas Garcia, **Product Engineer** (Buenos Aires). It must read in under a minute,
tell one story, and prove two things by being built well: front-end craft, and back-end distributed-systems depth.
It ends on AI: Lucas builds agent harnesses (Orchestra).

## The idea: a technical spec sheet with a person on it

The whole site looks like an engineering document: warm paper, hairline grids, mono annotations, corner crop marks,
part numbers, dimension lines. One signal orange. Dot-matrix numerals for years and counters. Then, near the end, the
page goes dark (graphite) for the AI chapter, as if the lights went down for the demo.

**What gives it personality (keep these, they are the point):**
- His real face, big, in the hero, layered with type and an orange disc.
- The story line: *"Learned to build before AI. Now I build with it."* The timeline is split by one orange line:
  **Nov 30, 2022 — ChatGPT ships.** Left of it is "Pre-AI", right of it "AI-native".
- A live Buenos Aires clock in the chrome. "Hecho en Buenos Aires" at the end.
- Interactive proofs instead of paragraphs: a spec overlay you can toggle, a saga you can break, a pipeline you can
  scroll through.

**What to avoid (this is why v1 felt generic):** paragraphs, card grids of bullet lists, centred hero text over a
gradient, glassmorphism, glow, rounded pill buttons, emoji, icons from icon sets. Every chapter shows one idea, with
at most ~30 words of prose on screen at once. Whitespace is a feature.

## Chapters (in order) and owners

| # | Chapter id | What it is | Ground | Owner |
|---|---|---|---|---|
| 01 | `hero` | Name, face, tagline | paper + grid | WP-H |
| 02 | `timeline` | Pinned horizontal build log 2019 → now | paper | WP-T |
| 03 | `craft` | Front end: a specimen with a toggleable spec overlay | paper-raised | WP-S |
| 04 | `systems` | Back end: a saga diagram you can break | paper-sunk | WP-S |
| 05 | `orchestra` | Agents: pinned dark chapter with scrubbed orange video | graphite | WP-O |
| 06 | `contact` | One line, one button, sign-off | paper | WP-H |

Chapter numbers ("02 — Build log") are shown in each chapter's label via `SectionHeader`'s `index` prop.

Layers (already wired in `src/app/page.tsx` and `src/sections/Sections.tsx`, do not change): chapters in `<main
class="relative z-20">`; the fixed WebGL artifact above them at `z-30` with `pointer-events-none` (it folds away to
nothing during chapters 02–04, so it never covers their text); nav at `z-40`; skip link `z-50`.

## Shared contracts (written; do not change them)

Do not edit `src/story`, `src/content`, `src/app`, `src/ui`, `src/artifact`, `docs`, config files or `package.json`
(WP-H is the exception for `src/ui`, see below). If a contract is wrong or missing something, say so in your report.

- **Copy:** everything comes from `src/content/site.ts` through props (types in `src/content/types.ts`). Never
  hard-code copy, except tiny presentational strings a component owns (axis ticks, "On/Off" state words, ARIA
  labels); keep those as named constants.
- **Chapters:** render your chapter with `<Chapter id="…">` from `@/story` (it renders the `<section>` with that id
  and registers it). It accepts normal section props (`className`, `style`, `ref` is internal).
- **Scroll:**
  - `useStory().through("orchestra")` is a `Signal<Progress>` running 0 → 1 from when the chapter's top meets the
    viewport top until the next chapter's top does. For a pinned (sticky) chapter that is exactly "progress
    through the pin". Read `.current().toNumber()` in animation frames; never put per-scroll values in React state.
  - Motion's `useScroll({ target, offset })` is also fine inside your own component, and is simpler for the
    timeline's horizontal pin.
  - `useActiveChapter()` re-renders only when the chapter changes (nav).
- **UI primitives** in `@/ui`: `Container` (page gutter, max 1400px), `LeftColumn`, `Label` (mono caption, `marked`
  adds an orange square, `tone`), `SectionHeader` (`label`, `heading`, `intro`, `index`, `tone`), `ButtonLink`
  (squared mono button with arrow, `variant`, `tone`), `Chip`, `BulletList` (numbered), `Reveal` (fade + rise once in
  view), `cx`, `EASE_OUT_EXPO`, and `type Tone = "light" | "dark"`.

## Design tokens (`src/app/globals.css`, Tailwind v4 utilities)

| Utility | Value | Use |
|---|---|---|
| `bg-paper` | `#f3f2ee` | page ground |
| `bg-paper-raised` / `bg-paper-sunk` | `#fbfaf7` / `#e7e6e0` | alternate light grounds |
| `text-ink` | `#0e0e0e` | primary text on paper |
| `text-ink-soft` | `#46463f` | secondary text on paper |
| `text-mute` | `#6f6f68` | metadata only (≥ 11px mono), never sentences |
| `border-line` / `border-line-strong` | ink 12% / 30% | hairlines on paper |
| `bg-graphite` / `bg-graphite-raised` | `#121212` / `#1c1c1b` | dark chapter |
| `text-fog` / `text-fog-dim` | `#eeede8` / `#a7a69f` | text on graphite |
| `border-line-dark` / `-strong` | fog 12% / 28% | hairlines on graphite |
| `bg-signal` / `text-signal` | `#ff5a1f` | the accent: fills, lines, large type, dots |
| `text-signal-ink` | `#c2410c` | orange for small text on paper (contrast) |
| `bg-signal-soft` | orange 14% | tints |
| `bg-grid` / `bg-grid-dark` | | hairline blueprint grid (96px lines, 16px dots) |
| `font-display` / `font-sans` | Geist | headlines (600–700, tracking −0.04em to −0.05em, leading 0.9–1) / body |
| `font-mono` | Geist Mono | labels, annotations, buttons: 11–12px uppercase, tracking 0.12–0.16em |
| `font-dot` | Doto (dot matrix, weights 600 and 900) | years, counters, readouts only |
| `ease-out-expo` | `cubic-bezier(0.16,1,0.3,1)`; in Motion use `EASE_OUT_EXPO` | |

Shapes are square-ish: radius 3–4px for controls, 0–8px for panels. Lines are 1px. Orange is rare: one or two marks
per screen, plus the timeline's AI side.

Motion: arrivals once, 0.6–1.0s, house easing, 60–90ms staggers, 16–32px travel. Continuous motion only where it
carries meaning (tokens on wires, the pipeline). Everything respects `prefers-reduced-motion` (`MotionConfig
reducedMotion="user"` is already at the root; for hand-written rAF/scroll effects check `useReducedMotion()`).

Responsive: must look deliberate at 390, 768, 1280 and 1920 px wide. No horizontal page scroll at any width.

## Coding rules

- TypeScript strict. No `any`, no non-null `!` unless a comment proves it safe.
- Data varies → discriminated union; behaviour varies → interface. A `switch` over a union ends with an
  `assertNever` default.
- A class must guard a rule or own behaviour; a value with no rule is a type alias. Fields `private`/`readonly`,
  explicit visibility on every member, no generic setters.
- Nothing instantiated at module load. Construct in components (`useState(() => new X())`) or in owning classes.
- Pure logic (timelines, sequencing, geometry, layout maths) lives in plain classes/functions with vitest unit tests
  (`*.test.ts`, node environment, no DOM). Components stay thin.
- No per-frame allocations in animation loops. Server components by default; `"use client"` only where needed.
- No new dependencies. Comments explain why, not what. No commented-out code, no TODOs.
- Accessibility: one `<h1>` (hero); an `<h2>` per chapter; real buttons for controls (`aria-pressed` /
  `role="switch"` + `aria-checked`), visible focus (global), decorative SVG `aria-hidden`, diagrams get a short
  `aria-label` or visually hidden description.

## WP-H — Chrome, hero, contact (`src/sections/**`, may refine `src/ui/**`)

Owns `Nav.tsx`, `HeroSection.tsx`, `ContactSection.tsx` and any helpers in `src/sections`. May polish `src/ui`
primitives but must keep every export and prop that exists today (other packages use them). Keep the prop
signatures of `Nav`, `HeroSection`, `ContactSection` exactly as the placeholders declare them. Do not edit
`Sections.tsx`.

**Nav (fixed, z-40, h-14).** Left: a small "LG" monogram square (ink, 28px, mono) + name. Centre (md+): the nav
items as mono labels; the active chapter (`useActiveChapter()`) gets ink text and an orange square, others
`text-mute`. Right: live clock "Buenos Aires 19:56" (mono, updates each minute, `Intl.DateTimeFormat` with the given
time zone; render a stable placeholder like "--:--" on the server and fill on mount to avoid hydration mismatch).
Paper background at 80% with backdrop blur and a bottom hairline once past the hero; transparent on the hero. In the
`orchestra` chapter it switches to the dark tone (graphite 80%, fog text). Below md: monogram + clock only.

**Hero (min-h-dvh, `bg-grid`).** A layered composition, the most important screen of the site:
1. **Sheet frame:** four corner crop marks (L-shaped 16px hairlines) inset 24px; mono annotations in the corners:
   top-left `hero.sheet.code — hero.sheet.title`, top-right `hero.sheet.revision`, bottom-right `hero.sheet.scroll`
   with a short animated vertical tick. Sits under the nav height, so offset the top marks below the nav.
2. **Name, huge, behind the portrait:** `hero.name` as two lines, `font-display` 700, uppercase, size
   `clamp(5rem, 19vw, 21rem)`, leading 0.82, tracking −0.06em, ink. Left-aligned at the container's left edge. The
   portrait overlaps the right part of the letters (name below the portrait in z-order).
3. **Orange disc:** a perfect circle of `bg-signal`, diameter ≈ 46% of the portrait height, centred behind the
   portrait's head (head centre ≈ 30% from the top and 52% from the left of the portrait image), behind the
   portrait, in front of the name.
4. **Portrait:** `next/image` of `hero.portrait` (transparent cutout, 1280×1589), `priority`, bottom-anchored to the
   hero's bottom edge, height ≈ 92dvh on lg, right side (its centre at ~66% of the viewport width). On < lg it is
   centred, height ≈ 62dvh, still bottom-anchored, with the name above/behind it.
5. **Copy block, bottom-left, above the portrait in z-order:** `Label` with `hero.role` (marked), then the tagline
   as two lines at `clamp(1.5rem, 2.6vw, 2.25rem)`, `font-display` 600, tracking −0.03em: first sentence ink, second
   sentence `text-signal`. Then the two `ButtonLink`s. Then `hero.facts` as a compact 3-column mono list
   (label `text-mute`, value ink, 12–13px). Max width ~30rem. On < lg the copy block sits below the portrait
   (the hero may be taller than the viewport on phones).
6. **Depth and movement:**
   - Entrance: name letters rise from a mask (stagger 40ms/letter); the disc scales from 0 to 1 (0.9s); the
     portrait rises 40px and fades in after 150ms; corner marks draw in; copy fades up last.
   - Scroll (`useScroll` on the hero, `["start start", "end start"]`): name moves up slower than the page (parallax
     −10%), the portrait faster (−18%) and scales to 0.94, the disc grows to 1.25× and slides up, the copy fades out
     by 60%.
   - Pointer (fine pointers only, skip for reduced motion): portrait ±10px, disc ∓18px, name ±6px, damped with a
     spring, so the layers separate in depth.
   - Keep all of it on transforms/opacity only.

**Contact (min-h-[80dvh], paper, `bg-grid`).** Chapter label "06 — Contact". Heading at `clamp(3rem, 8vw, 8rem)`,
display 700, tracking −0.05em, with the last word in `text-signal`. One line of body. The link buttons. A bottom
rail: `contact.signoff` · live clock · `contact.footnote`, mono, hairline above. The right ~40% of the screen stays
empty on lg (the assembled artifact rests there).

## WP-T — Timeline (`src/timeline/**`)

`TimelineChapter({ timeline })` (keep the signature). The centrepiece of the story.

**Desktop and tablet (md+): pinned horizontal scroll.**
- The chapter is tall; inside it a `sticky top-0 h-dvh overflow-hidden` frame. Vertical scroll through the chapter
  translates a horizontal track from x = 0 to x = −(trackWidth − viewportWidth). Measure the track with a
  `ResizeObserver` and set the chapter's height to `100dvh + (trackWidth − viewportWidth)` so the pin lasts exactly
  as long as the track. Drive x from `useScroll({ target: chapterRef, offset: ["start start", "end end"] })` +
  `useTransform`; smooth it lightly with `useSpring` (stiffness ~200, damping ~40), not for reduced motion.
- **Fixed parts of the frame (do not move with the track):**
  - Top-left: `SectionHeader` (index "02", heading, intro), compact.
  - Top-right: a big dot-matrix year readout (`font-dot` 900, `clamp(4rem, 9vw, 8rem)`) showing the year of the
    stop nearest the reading line, with the stop's `period` under it in mono; a thin progress bar under that (scaleX
    = progress), ink before the marker, orange after.
  - Left edge, vertically: lane labels `lanes.world` (above the axis) and `lanes.me` (below it), mono `text-mute`,
    rotated −90° or as small tags.
  - A faint vertical **reading line** at ~42% of the viewport width (1px dashed `line-strong`). The stop whose
    column is closest to it is "active".
- **The track:** a horizontal axis line across the middle of the frame (1px ink), with stops spaced ~38vw apart
  (min 340px), starting at ~45vw so the first stop begins near the reading line. Each stop is a column:
  - on the axis: a node (10px square). Pre-AI: hollow ink square. AI: filled orange square.
  - above the axis (world lane): `trend`, 15–16px, `text-ink-soft`, max 26ch, bottom-aligned to the axis with 28px
    gap.
  - below the axis (me lane): `year` in `font-dot` 600 at 40px `text-mute`, then `company` (display 600, 24–28px,
    ink), `role` (mono 11px uppercase, `text-mute`), then `did` (16–17px ink, max 28ch).
  - `kind: "project"` stops get a small mono tag "Side project" and a dashed node.
  - The active stop is fully opaque; others fade to ~0.35 opacity; transitions 300ms. Active is decided per animation
    frame from the track x (a pure function: given x, column positions and the reading line → active index; unit
    test it). Update the active index with a ref + direct style writes or a state change only when the index changes.
- **The marker:** between stop `marker.afterStop` and the next. A full-height vertical orange line (2px) with,
  at the top, mono `marker.date` and a display-600 `marker.label` in orange, and `marker.note` (14px, ink-soft,
  max 24ch). From the marker onward the axis line is orange. Era captions sit on the axis: `eras["pre-ai"]` near the
  start, `eras.ai` just after the marker (mono 11px, with a small arrow →).
- Entrance: when the pin starts, the axis draws from left to right (scaleX 0 → 1, 1s) and the first stop rises in.
- Reduced motion: keep the pin (it is reader-driven) but no spring, no draw-ins.

**Phones (< md): no pin.** A vertical timeline: the axis is a vertical line on the left, each stop a block with the
year (dot font), company, role, `did`, and `trend` in a smaller "The industry:" line. The marker is a horizontal
orange rule across the width with its date, label and note, and the stops after it have orange nodes. Reveal each
stop as it enters view.

Unit-test the pure maths (track length from stop count and widths, x → active index, x → progress, marker position).

## WP-S — Front end and back end (`src/craft/**`, `src/systems/**`)

Two chapters. Keep the signatures `CraftChapter({ craft })` and `SystemsChapter({ systems })`.

### Craft (`bg-paper-raised`, py-32 lg:py-48)

Two columns on lg (stack on smaller): left 5/12 = `SectionHeader` (index "03") + `craft.stack` as `Chip`s + the
spec toggle button; right 7/12 = **the specimen stage**: a `bg-paper-sunk bg-grid` panel (aspect ~4:3, radius 8px)
with a real, working mini UI card centred in it:
- The card (paper-raised, 1px line, radius 16px, padding 24px, width ~360px): a small square glyph (draw a simple
  speech-bubble mark in SVG, not a brand logo), `specimen.title` (15/24 semibold), `specimen.subtitle` (13px
  ink-soft), a status pill (`specimen.status` with a pulsing 6px orange dot), a switch row (`specimen.switchLabel` +
  a real `role="switch"` toggle that animates its thumb with the house easing over 320ms; on = ink track, off =
  line-strong), and a secondary button `specimen.action`.
- **The spec overlay** (toggled by the "Show spec / Hide spec" button, `aria-pressed`; turns on by itself once when
  the stage is 50% in view): SVG redlines drawn over the card in orange, 1px, with mono 10–11px labels on small
  paper tags:
  - `padding`: dimension lines showing the 24px insets on the left and top;
  - `radius`: a quarter-arc callout on a corner;
  - `type`: a leader line to the title;
  - `contrast`: a tag next to the subtitle;
  - `focus`: the action button shows its focus ring (2px orange, 3px offset) while the spec is on;
  - `motion`: a tiny plotted easing curve (cubic-bezier(0.16,1,0.3,1)) next to the switch, with a dot that runs
    along the curve each time the switch is toggled;
  - `role`: a tag on the switch.
  Lines draw in with stroke-dashoffset (0.6s, staggered 60ms); labels fade in after their line. Values come from
  `craft.notes` by `id`. Positions must follow the real card: measure it (ResizeObserver) and compute annotation
  geometry in a pure, tested function from the card's box; don't hard-code pixel offsets.
- Below lg the overlay labels may wrap under the card as a numbered legend (numbers on the redlines).

### Systems (`bg-paper-sunk`, py-32 lg:py-48)

`SectionHeader` (index "04") top-left, `systems.principles` as a `BulletList` top-right on lg. Below, full width,
**the saga diagram** (SVG + HTML, responsive):
- Top row: `edge.client` → `edge.gateway` (label "JWT" as a tiny mono tag on the gateway).
- A horizontal bus line labelled `edge.bus` across the width; `edge.orchestrator` node sits on the bus at the
  left, hosting the saga.
- One service node per `steps[i]` along the bus (`service` name in display 600, a tiny mono caption "Postgres ·
  Redis" under it), each with a status light (idle: hollow; running: ink pulse; done: ink check; failed: orange ✕;
  compensated: orange ↺).
- Under the diagram: the two controls (`controls.run`, `controls.fail`) as `ButtonLink`-styled `<button>`s, the
  outcome readout (`outcomes.committed` or `outcomes.rolledBack`, mono, orange for rolled back) and an event log
  (mono 12px, last 6 lines, newest at the bottom, e.g. `orchestrator → Payments  Charge card` /
  `Inventory  ✕ failed` / `orchestrator → Payments  Refund`), `aria-live="polite"`.
- **Run (happy path):** a small ink token travels client → gateway → orchestrator, then for each step the token goes
  orchestrator → service along the bus and back (≈450ms each way), the service shows running then done; ends with
  "Committed".
- **Fail:** same until `steps[failingStep]`, which fails (orange ✕, short shake). Then the orchestrator sends
  **orange** compensation tokens back through the completed steps **in reverse order**, each running its
  `compensation` (skip steps whose compensation is empty); they show the ↺ state; ends with "Rolled back ·
  consistent".
- The run plays automatically once (happy path) when the diagram is 40% in view; the buttons replay either path;
  buttons are disabled while a run is in progress.
- Model the run as a pure sequencer: a class that, given the steps, the failing index (or none) and a time `t`,
  returns the token position (segment + fraction), every node's status and the log lines so far. Unit-test it
  (happy path order, failure stops forward progress, compensation is reverse order and skips empty compensations,
  log contents). The component just advances `t` with rAF and renders.
- Under the diagram, `systems.stack` as `Chip`s.
- Below md the diagram goes vertical: the bus is a vertical line, services stacked.
- Reduced motion: no travelling tokens; statuses change step by step every ~400ms.

## WP-O — Agents (`src/orchestra/**`, `src/backdrop/**`)

`OrchestraChapter({ orchestra, sequence })` (keep the signature). The dark chapter.

**Backdrop refactor (`src/backdrop`).** Turn the old fixed, page-wide `Backdrop` into a positioned
`FrameSequencePlayer({ sequence, progress, className, focalX?, focalY? })` that fills its parent (`absolute
inset-0`), takes any `Signal<Progress>`, and keeps everything the controller already does (set selection, loading
order, nearest-loaded fallback, inertia, cover fit, repaint only on change). Remove the old full-page overlays (the
chapter owns its own scrims) and the old `Backdrop` export. Keep the existing tests passing and update them for any
renamed pieces. Frames are in `public/sequence/orchestra/854/0001.webp…0145.webp` (an orange network, camera flying
in toward a glowing core on the centre-right).

**The chapter.** `bg-graphite`, height 320dvh, with a `sticky top-0 h-dvh overflow-hidden` frame:
- Background: the `FrameSequencePlayer` scrubbed by `useStory().through("orchestra")`, focal point x 0.62. Scrims:
  graphite from the left (85% → 0 by 55% width), from the bottom (last 30%), and a faint `bg-grid-dark` on top.
  Reduced motion: hold the frame at 70% of the sequence.
- Left column (lg: 44% width; full width below): `SectionHeader` (index "05", `tone="dark"`), then the three
  `principles` revealed one by one as progress passes 0.2, 0.35 and 0.5 (each line: an orange mono index and 17–18px
  fog text; previous ones stay visible).
- Stats row (from 0.55): three items, value in `font-dot` 900 at `clamp(3rem, 6vw, 5rem)` fog, counting up from
  "00" over 0.8s when they appear, label in mono `text-fog-dim`.
- **Pipeline rail** along the bottom of the frame (full container width, above the bottom scrim): the seven
  `stages` as small square nodes on a 1px `line-dark-strong` line, with mono labels under them. A **ticket token**
  (orange square with a mono id "F-12") moves along the rail driven directly by scroll progress (0.15 → 0.95 maps
  to the first → last stage); the rail behind the token turns orange; each stage node lights (filled orange) as the
  token passes. This is scroll-linked, not time-based: scrubbing back moves it back.
- **Agent log**, bottom-right above the rail on lg (hidden below md): a small terminal panel (`bg-graphite-raised`,
  1px `line-dark`, radius 6px, mono 12px, ~320px wide, 7 lines tall) that reveals `log` lines in order as progress
  passes evenly spaced thresholds (scroll-linked; scrolling back hides them). `actor` in orange, message in fog.
  A blinking block cursor on the last line.
- Keep the right ~40% of the frame above the rail free of text: the assembled 3D artifact rests there (around
  x 74%, y 42%).
- Map progress to discrete UI state (which principles, stats, active stage, visible log lines) with a pure, tested
  function; drive the token position and rail fill by writing transforms in a `subscribe` callback or rAF, not via
  React state per frame. Update React state only when a discrete step changes.

## Gate

`pnpm gate` runs typecheck, lint, tests and a production build. It must pass before you commit. Do not start a dev
server or open a browser; visual review happens at integration.
