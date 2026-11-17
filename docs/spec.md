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
    viewport top until the next chapter's top does. For a pinned (sticky) chapter the pin ends one viewport earlier
    (at `(height − 100dvh) / height`), so rescale to pin progress (see `src/orchestra/PinProgress.ts`). Read `.current().toNumber()` in animation frames; never put per-scroll values in React state.
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

---

# v2.1 — the owner's review (2026-11-13)

The owner liked v2 and asked for five changes. The content contracts for all of them are already on `main`
(`src/content/types.ts`, `src/content/site.ts`): new fields were added **alongside** the old ones so `main` still
compiles. Each work package deletes the old fields it retires, in both files, as its last step. Touch only your own
hunks of those two files. Everything in "Shared contracts", "Design tokens" and "Coding rules" above still applies.

## WP-H2 — Hero, contact, timeline (`src/sections/**`, `src/timeline/**`)

**1. Hero: the name is never covered; the portrait sits inside the orange circle as a frame.**
- Retire `hero.tagline` (delete it from the type and the content). Use `hero.role` and the new `hero.summary`.
- lg and up: a two-column composition on `bg-grid`, inside `Container`, vertically centred in `min-h-dvh`
  (leave room for the nav at the top and the sheet frame's corner annotations).
  - **Left (~58%)**: the `<h1>` name, two lines, uppercase, as big as it can be while staying inside its column
    and never overlapped by any layer (size by both `vw` and `dvh`; at 1280×720, 1440×900 and 1920×1080 the whole
    left column must fit without overlapping the circle). Under it, **the role with real presence**: "Product
    Engineer" in `font-display`, weight 600, `text-signal`, around `clamp(2rem, 4vw, 4rem)`, tracking −0.04em.
    Then `summary` in `text-ink-soft`, 17–19px, max ~38ch. Then the two buttons, then the facts row (as today).
  - **Right (~42%)**: the circular frame. An orange disc (`bg-signal`) about `min(34vw, 62dvh)` across. The
    portrait cutout is clipped to the circle (`rounded-full overflow-hidden`), scaled so the face sits a little
    above the centre and the shoulders run off the bottom edge of the circle; the head must not be cropped at the
    top. Around it, spec-sheet annotation in hairlines: a thin ring (`border-line-strong`) ~14px outside the disc
    with four short tick marks at 12, 3, 6 and 9 o'clock, a dashed outer ring that turns slowly (one turn per ~90s;
    static under reduced motion), and one mono caption at the bottom-right of the ring, e.g. `FIG. 01 — PORTRAIT`
    (a named constant).
  - Keep the depth: scroll parallax (the circle group drifts up slower than the page) and pointer depth (inside the
    clip the portrait shifts a few px opposite to the disc, so the frame feels like a window). Transforms and
    opacity only. Keep the letter-by-letter name entrance; the disc scales in from 0, the portrait rises inside
    the clip, the role/summary/buttons/facts reveal after.
- Below lg: name (two lines, fits the width) → circle centred at ~78vw → role → summary → buttons → facts. No
  horizontal scroll at 375px.
- Remove now-unused code (the old HEAD/DISC_RATIO layout, `copyOpacity` fade if it no longer applies).

**2. Contact: add the email.**
- `contact.email` is new; `contact.links` now starts with a `mailto:` link. Buttons: the first link primary, the
  rest secondary (as today). Under the buttons, show the address in `font-mono` 14–15px `text-ink` with a small
  "Copy" button next to it (a real `<button>`; uses `navigator.clipboard.writeText`; on success its label becomes
  "Copied" for 2s, announced through an `aria-live="polite"` region; if the clipboard is unavailable it does
  nothing). Button words are named constants.

**3. Timeline: no Orchestra stop; roles get the accent and more presence.**
- The Orchestra stop is already gone from the content. Retire `StopKind` and `TimelineStop.kind` (types and
  content), delete `sideProjectTag.ts` and every project-specific branch (dashed nodes, the tag).
- In both the pinned track (`StopColumn`) and the phone list (`VerticalTimeline`): year → company (`h3`, as today)
  → **role** in `font-display` 20–22px, weight 600, `text-signal-ink` (orange that passes contrast on paper), with
  an 8px `bg-signal` square before it → `did`. The role must read as the second most prominent line of a stop.

## WP-S2 — Back end diagram (`src/systems/**`)

**The orchestrator is the hub; the services sit around it.** The current diagram puts the orchestrator in a row
with the services, which reads as if it were one of them. Redraw it as a hub and spokes; keep the saga semantics,
the controls, the outcomes and `SagaSequencer` (adjust its tests only where node ids/geometry change).
- Wide (lg+): `Client → API gateway` on the left (HTTP edge, labelled in mono), then one edge from the gateway into
  the **Saga orchestrator** hub in the centre of the remaining space. The hub is the largest node (orange 1px
  outline, `bg-paper-raised`), with a thin circular **NATS** ring around it (labelled "NATS" in mono). The four
  services sit around the hub at the diagonals in step order, clockwise from top-left: Orders (NW), Payments
  (NE), Inventory (SE), Shipping (SW). Each is joined to the hub by a spoke that crosses the NATS ring.
- Narrow (< lg): the same ring, square, with the gateway above it (`Client → API gateway` stacked above the hub).
  Must fit 375px without horizontal scroll; service cards may shrink to name + action.
- Playback (unchanged semantics, new geometry): for each step a command token travels hub → service along its
  spoke, the service lights, a reply token returns service → hub. Failure run: Inventory fails (red ✕ as today),
  then compensations run **in reverse** — hub → Payments ("Refund"), hub → Orders ("Cancel order") — each
  compensation labelled in mono next to its service. The outcome ("Committed" / "Rolled back · consistent") shows
  in or just under the hub. Reduced motion: jump to each state without tokens.
- The geometry lives in a pure, tested layout (`DiagramLayout`): positions for wide and narrow, spoke routes, ring
  radius. Keep tokens driven by rAF/transforms, not React state per frame.
- **PoC link.** Under the controls/diagram, add `systems.repo`: a secondary `ButtonLink` with `repo.label` (it is
  external, so `ButtonLink` already opens a new tab with ↗) and `repo.note` in mono `text-mute` beside it.

## WP-O2 — Agents chapter as an SDLC with workers working (`src/orchestra/**`)

The owner wants it framed as a software development lifecycle — independent departments that hand work to each
other to deliver one feature — and the UI to show **workers working**, not a linear loader. Retire
`orchestra.stages` and `orchestra.log` (and `LogLine`) from types and content, and delete `PipelineRail` and
whatever only it used. The new content is `orchestra.departments` (7, each with a roster of agents) and
`orchestra.steps` (10 beats: the department holding the work, the workers busy in it — a name may repeat for
parallel instances; empty means code does it, not an agent — a ticket id and a short message).

Keep: the chapter shell (`h-[320dvh]`, sticky frame, `FrameSequencePlayer` background, scrims, `PinProgress`),
`SectionHeader` (index "05", dark), the principles and the stats. The 3D artifact is now hidden in this chapter,
so the whole frame is yours.

**Layout (lg+).** Left column (~36%): header, principles, stats (tighten spacing so they fit at 1440×900 and
1280×720). Right (~60%): **the department board** and, under it, **the dispatch log**.
- **Board:** seven department cards in a grid (e.g. 4 + 3, or a 3×3 with the centre left for the ticket), each a
  small panel (`bg-graphite-raised/80`, 1px `line-dark`, radius 6px): mono department name, a status pill
  (`idle` / `working` / `handing off` / `automated`), and its roster as rows (agent name in mono 11–12px). Hairline
  **channels** connect departments that hand off to each other in `steps`.
- **Scroll drives the story** (pin progress 0.15 → 0.95 spread evenly over the steps; scrubbing back rewinds):
  the active step's department lights (orange outline, status `working`); its `workers` rows come alive; the
  previous department shows `handing off` briefly; a **ticket packet** (orange square + mono ticket id) travels
  along the channel from the previous step's department to the new one. Departments already visited keep a small
  done mark. A step with no workers shows `automated` and a mono "by code" note — that is a point to make.
- **Time drives the work** (this is the "workers working" part): while a worker row is active it shows live,
  looping activity — a thin progress bar filling and restarting at slightly different speeds per worker, a
  pulsing status dot, and a tiny changing mono readout (e.g. a step counter or a spinner glyph). Parallel
  instances (the three `engineer`s) appear as three separate rows each with its own bar, so parallelism is visible.
  Idle rows are dim and still. Pause all looping work when the chapter is off screen and under reduced motion
  (show static "working" state instead).
- **Dispatch log** (replaces the agent log, same terminal style): one line per reached step, `ticket` in orange,
  `department · message` in fog, newest at the bottom with the blinking cursor; scroll-linked.
- Below lg: header, principles and stats, then the board as a compact list (one row per department: name, status
  pill, active worker count with its bars) and the log hidden. Fits 375px.
- Pure, tested logic: a function/class mapping pin progress → discrete state (principles shown, stats shown,
  active step index, per-department status, visited departments, packet route), and the channel/packet geometry
  if you compute it. React state changes only when the discrete state changes; packet motion and activity bars
  via transforms/CSS animations, not per-frame state.

### v2.2 — career milestones

The single "ChatGPT ships" marker is gone. `timeline.milestones` lists promotions and company changes, each drawn as
an orange strip in the gap between the two stops it separates (`afterStop`): a strip from the top of the frame to
the axis, a diamond node on the axis, and a kind · date line, label and note. On phones each is a short orange rule
with a diamond on the axis. The Pre-AI / AI-native split is now derived from the stops' `era` (`eraBoundary`), and a
milestone takes the era of the stop after it, so "Salesforce → Clarifai" opens the AI-native era.

## v2.3 — Capabilities, read like a resume (WP-K)

The owner's direction (2026-11-17): after the build log, a big landmark tells the reader that everything below it is
what he can do. The domain chapters then read like a resume a recruiter can scan: plain headings ("Front end",
"Back end", "AI"), no slogans, a table of skill areas with the **libraries** used in each, and the existing demos kept
as "exhibits" under the tables. Private projects are never named; the "Where" column names only employers, and only
where LinkedIn backs it.

### Story order

`CHAPTER_IDS = ["hero", "timeline", "capabilities", "craft", "systems", "ai", "orchestra", "contact"]`.
`capabilities` and `ai` are new. The orchestra chapter (the pinned SDLC board) stays untouched as AI's exhibit, so its
pin maths do not change. The 3D artifact stays folded (scale 0) in both new chapters.

### Capabilities landmark (`src/capabilities/**`, `bg-graphite text-fog`, min-h-dvh)

- A 4 px `bg-signal` strip across the top edge, echoing the timeline milestones.
- Top row in mono 11 px, uppercase: the label "Capabilities" on the left and "03 — 05" on the right.
- One giant display word, "Capabilities", sized to the container width the way the hero name is (container query,
  about `min(15cqw, 22dvh)`), `text-fog`, tight tracking. It is the landmark: it must read from across the room.
- One plain intro line under it (`text-fog-dim`).
- An index of the three domains, one row per domain, each row an `<a href="#craft|#systems|#ai">`: the dot-matrix
  number (`font-dot`), the domain name in display type (`text-3xl md:text-5xl`), a preview of its first six tools
  joined by " · " (mono, `text-fog-dim`, hidden below md), and an arrow. Hairline rows (`border-line-dark`). On hover
  and focus, the name and arrow turn `text-signal`.
- The rows are derived from the domain content (name, chapter, tools), never typed twice.

### Domain chapters: header, skill table, exhibit

Every domain chapter (craft 03, systems 04, ai 05) is `SectionHeader` (label "Capabilities", heading = the domain
name, one factual intro), then a `SkillTable`, then an exhibit.

`SkillTable` (`src/ui/SkillTable.tsx`, with a `tone` like `Chip`): a resume table with a column-header row in mono 11 px
uppercase ("Area", "Libraries & tools", "Where"), then one row per area with a hairline top border and `py-6`:

- **Area** (lg: 4 cols): the name in display `text-xl font-semibold`, with the one-line summary under it in
  `text-sm text-ink-soft`.
- **Libraries & tools** (lg: 6 cols): plain text, `text-base font-medium text-ink`, items joined by a muted " · ".
  This is not chips: recruiters scan text faster than tags.
- **Where** (lg: 2 cols, right-aligned): employers in mono 11 px uppercase `text-mute`, or "—" when empty.
- Below lg, each row stacks: area, summary, tools, where. Use a real `<table>` on lg and up for semantics, or a
  `<dl>`/list with visually hidden column headers. Either way it must be readable by a screen reader.

The exhibit is a small `ExhibitHeader` (mono "Exhibit A — {label}" in `text-signal-ink`, a `text-2xl` title, and a
one-line caption), followed by the existing demo:

- **Craft:** `SpecWorkbench`, with its `header` slot holding the `ExhibitHeader` and its `stack` slot removed.
- **Systems:** the principles list beside the `ExhibitHeader`, then `SagaDiagram` with its PoC link.
- **AI:** the `ai` chapter (`bg-paper`) ends with an `ExhibitHeader` that introduces the board. The pinned orchestra
  chapter that follows is the exhibit itself. Its label becomes "Exhibit C — Agentic SDLC" and its heading "Orchestra".

The `stack` chip lists of craft and systems are removed; the skill tables replace them.

### Nav

Build log · Front end · Back end · AI · Contact. "AI" points at the `ai` chapter.

Correction after review: the `ai` chapter has no `ExhibitHeader`, because the pinned Orchestra stage carries its own.

## v2.4 — Repository cards (WP-R)

The owner's direction (2026-11-17): each domain chapter shows a few repositories a recruiter can open. The saga
diagram goes; its repository becomes a card. Some repositories do not exist yet: they will be built as showcase
repos (one pairs MediaBunny with React Flow, for the Runway Product Engineer role) and published later. Until then
their card says "In progress" and links nowhere. The page is not deployed while any card is still in progress.

### Order inside each domain chapter

- **Front end:** header → skill table → **Repositories** → Exhibit A (the spec workbench).
- **Back end:** header → skill table → **Repositories**. The saga diagram, its exhibit header and its principles are
  removed, together with all saga code and content.
- **AI:** header → skill table → **Repositories**. The pinned Orchestra chapter follows, relabelled "Exhibit B —
  Agentic SDLC" now that the back end has no exhibit.

### `RepoCards` (`src/ui/RepoCards.tsx`)

- A small mono header row: "Repositories" on the left, the count ("02") on the right. Then a grid with
  `md:grid-cols-2` and `xl:grid-cols-3` and `gap-4`.
- Each card has `border-line`, `rounded-lg`, a background one step lighter or darker than its chapter, and `p-6`,
  with a flex column at full height:
  - **Top row:** a mono 11 px index ("Repo 01") on the left and a status on the right. Public shows a `bg-signal`
    dot and "Public"; in progress shows a hollow `border-line-strong` dot and "In progress".
  - **Name:** in Geist Mono, `text-lg md:text-xl font-semibold text-ink`, with `break-words` because the names are
    long (`transactional-microservices`).
  - **Description:** two or three lines, `text-[15px] leading-[1.55] text-ink-soft`.
  - **Tools:** the same " · " text list as `SkillTable` (extract a shared `ToolList`), `text-sm font-medium`.
  - **Footer:** pushed to the bottom with `mt-auto`, separated by a hairline. A public card shows "View on GitHub ↗".
    An in-progress card shows "Coming soon" in `text-mute`.
- A public card is a single `<a target="_blank" rel="noreferrer">` covering the whole card. On hover its border
  turns `border-ink` and its arrow nudges. An in-progress card is an `<article>` with no link.
- Each card's status is a discriminated union, `{ kind: "public"; href } | { kind: "soon" }`, rendered with a
  `switch` and `assertNever`.

## v2.5 — Labels in sans, numbered sub-sections, drawn repo illustrations (WP-L)

The owner's review (2026-11-17):

- He dislikes the "terminal font" (Geist Mono). The dotted Doto numerals stay.
- The sub-parts of the domain chapters are too small to explain why they are there, and need more space between
  them.
- The repository cards need an image. He chose diagrams drawn in code over generated images.

### Labels font

- Add `--font-label: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif` to the theme, and replace every
  `font-mono` class in `src/` with `font-label`.
- Remove `--font-mono` and the `Geist_Mono` font load.
- Doto's fallback becomes the sans stack.
- Labels keep their uppercase, size and tracking, but get `font-medium` where they are 11–12 px, so the sans
  holds up at that size.
- Repo names become `font-display` semibold with `tracking-[-0.02em]`.

### Numbered sub-sections

Each domain chapter is split into numbered sub-sections, separated by `gap-24 lg:gap-36`. Each one opens with a
`SubsectionHeader` (`src/ui/SubsectionHeader.tsx`):

- **Rule:** a 1 px `border-ink` rule across the top, then `pt-6`.
- **Left side:**
  - the number in Doto (`font-dot text-2xl md:text-3xl text-signal`, e.g. "03.1");
  - the title as display type (`text-3xl md:text-[2.75rem] font-semibold tracking-[-0.035em] text-ink`);
  - an optional caption (`text-base md:text-lg text-ink-soft`, max 44ch).
- **Right side:** on md and up, an optional count as a small uppercase label ("05 areas", "02 repos").
- **Spacing:** `mb-10 lg:mb-14` before the content.

The sub-sections:

- **Front end:**
  - 03.1 Skills
  - 03.2 Repositories
  - 03.3 Live demo (it replaces "Exhibit A"; `ExhibitHeader` and the `Exhibit` type are removed)
- **Back end:**
  - 04.1 Skills
  - 04.2 Repositories
- **AI:**
  - 05.1 Skills
  - 05.2 Repositories
  - The pinned Orchestra stage's label becomes "05.3 — Live demo", and its heading stays "Orchestra".

`RepoCards` loses its own small header row; the sub-section header now carries the title and count.

### Repo illustrations

- `Repo` gains `illustration`, one of: `"node-graph" | "website" | "saga" | "job-queue" | "departments" | "storyboard"`.
- `RepoIllustration` (`src/ui/illustrations/`) maps it with a `switch`/`assertNever` to one inline SVG component per
  kind.
- Every drawing uses viewBox `0 0 320 180`, at the top of the card in a `rounded-md border border-line
  bg-paper-sunk bg-grid aspect-[16/9]` frame, `aria-hidden`. The repo name is the accessible text.
- **Style:** the spec-sheet line style. `stroke-ink` hairlines (1–1.25), `fill-paper` boxes with `rx` 4–6,
  `stroke-line-strong` for secondary lines, and `signal` orange only for the one thing that is "happening".
  Text labels are 9–10 px Geist sans (`font-label`), uppercase where they are labels.
- **Motion:** at most one subtle CSS animation per drawing (a dot travelling an edge, a progress bar filling),
  only under `motion-safe:`. Static under reduced motion.
- **The drawings:**
  - **node-graph** (`reel-graph`): four nodes, "Clip", "Trim", "Blur" and "Export", linked by bezier edges with round
    port handles. "Clip" shows a tiny filmstrip thumbnail. The edge into "Export" is orange, with a dot travelling
    along it.
  - **website** (`lucheti.dev`): a browser window with three dots in the title bar. Inside, two thick headline bars
    on the left and an orange disc with a thin ring on the right, with a small faceted polygon overlapping it.
  - **saga** (`transactional-microservices`): a hub circle "Orchestrator" in the centre, with four service boxes
    around it ("Orders", "Payments", "Inventory", "Shipping") joined by spokes. "Inventory" has an orange ✕, and a
    dashed orange arrow curves back to "Payments" (the compensation).
  - **job-queue** (`render-queue`): an upload arrow into a queue of stacked slots, which fans out to three worker
    boxes with progress bars (one orange and filling), and then into a storage cylinder.
  - **departments** (`orchestra`): a 3×2 grid of small department cards, each with a name and two or three worker
    dots, plus an orange ticket packet moving between two of them.
  - **storyboard** (`shot-planner`): a chat bubble with two text lines on the left, an arrow, then three 16:9
    storyboard frames with simple shapes inside. The third frame is being generated, with an orange progress bar.

## v2.6 — Orchestra moves to its own page, `/orchestra` (WP-P)

The owner's direction (2026-11-17): Orchestra no longer belongs on the main page. It gets its own path, where it is
explained properly as a case study, and the live board runs there.

### Main page

- `CHAPTER_IDS` drops `"orchestra"`: hero, timeline, capabilities, craft, systems, ai, contact. Update the pose tables,
  the Nav `switch` and the tests (contact becomes index 6), keeping the meaning of every assertion.
- The AI chapter's third sub-section becomes **05.3 Case study**, with the caption "How Orchestra runs a software
  lifecycle with agents, and the board running live."
  - Its content is one wide link card, `<a href="/orchestra">`, laid out in two columns on lg (the drawing on the
    left at 7/12, the text on the right at 5/12).
  - **Drawing:** the `departments` drawing, large.
  - **Text:**
    - the title "Orchestra" (display, `text-3xl md:text-4xl`);
    - the one-sentence lede;
    - three stats in a row (Doto numerals, e.g. "07 Departments");
    - an orange "Read the case study →" line.
  - **Hover:** the border turns `border-ink` and the arrow nudges.
- The `orchestra` repo card stays as it is ("In progress", until the repository is public).

### `/orchestra` (`src/app/orchestra/page.tsx`, a second composition root)

- **Metadata:** `title: "Orchestra — Lucas Garcia"`, plus a one-line description.
- **Top bar:** fixed, paper with a hairline, the same height as the main nav. On the left, the monogram and "Lucas
  Garcia" link back to `/`. On the right, "← Back to the portfolio" links to `/#ai`.
- **Hero** (`bg-paper`, `pt-40 pb-24`):
  - the label "Case study";
  - an h1 "Orchestra" at the size of the main hero name's smaller breakpoint (`text-[clamp(4rem,12vw,10rem)]`);
  - the lede;
  - a facts row (16 agents · 7 departments · 3 parallel workflows · built on Claude Code).
- **01 Live demo:** a short `SubsectionHeader` inside a Container, then the existing pinned board (`OrchestraStage`,
  dark, its own 320dvh section) exactly as it is today. Its pin progress comes from a new element-scroll signal
  instead of the main page's story (see below). Its label becomes "Live demo" and its heading stays "Orchestra".
- **02–08:** numbered sub-sections on paper, with the same `SubsectionHeader` and `gap-24 lg:gap-36` rhythm as the
  domain chapters. Each one is a short intro sentence plus a list of 3–5 points: a bold lead phrase, then one
  sentence. No walls of text. The order and substance:
  - **02 The idea:** an autonomous software company as a Claude Code plugin. Departments are groups of agents with a
    head who owns their work. They coordinate only through tickets. You lock the mission and the architecture at
    genesis; after that the company runs and improves itself.
  - **03 Departments:** a grid of the seven departments (3 columns on lg). Each card shows the name, a one-line duty,
    and its agents (head first) from `orchestra.departments`.
  - **04 Code decides, not models:**
    - `company.yaml` is the single source of departments, roles, lifecycles, evidence and budgets.
    - `orch` is the only thing that changes state. It checks who may make each transition and verifies the evidence
      itself: tests, scope, protected paths, skipped tests, docs, and the independence of reviewers.
    - The wake planner decides what runs next.
    - Merging, releasing, deploying and rolling back are done by code, never by an agent.
  - **05 Tickets, not chat:**
    - intake to the head of product;
    - templates (feature, bugfix, spike, sprint);
    - documents merge like code;
    - requests between departments;
    - ordering between cards;
    - decisions recorded in the tracker.
  - **06 Guardrails:** the hooks.
    - SessionStart injects the brief or inbox.
    - PreToolUse on Bash denies raw tracker writes, force pushes and deploys.
    - PreToolUse on Edit/Write keeps edits inside the ticket's scope.
    - Stop: a worker cannot quit with its ticket unfinished.
    - PostToolUse runs the formatter.
  - **07 Releases with a safety net:**
    - stage on QA, then a QA sign-off through a parallel regression sweep;
    - ship only the signed-off commit;
    - production health checks with automatic rollback, and a bug filed;
    - stuck releases wake the release manager.
  - **08 Learning:**
    - retros after friction;
    - lessons that reach every matching brief;
    - promotion to a global playbook (seen 3 times or in 2 projects);
    - handbook changes approved by the department head.
- **Built with:** a final row of tools as a `ToolList`: TypeScript, Bun, Claude Code plugins (agents, hooks, skills,
  workflows, monitors), Beads, launchd.
- **Footer:** the same as the main contact footer's bottom line, plus a link back to the portfolio.
- **Content:** all copy lives in `src/content/orchestraPage.ts` (typed in `types.ts`), and reuses `SITE.orchestra`
  for departments, steps, stats and principles.

### Progress without the main story

`OrchestraStage` takes a `progress: Signal<Progress>` prop instead of calling `useStory()`. A new
`ElementScrollProgress` (in `src/story`, implementing `Signal<Progress>`, with a test for its maths) maps an element's
scroll to 0 when its top meets the viewport top, and 1 when its bottom meets the viewport bottom. That is exactly the
sticky frame's pinned span, so `PinProgress` is not needed on that page. Remove `PinProgress` if nothing else uses
it. The `/orchestra` page runs Lenis smooth scrolling like the main page.

## v2.7 — Compact landmark, living backgrounds, tool pills, cleaner cards (WP-Q)

The owner's review (2026-11-17), point by point.

### 1. The Capabilities landmark is too big for what it holds: make it compact

- Drop `min-h-dvh`; use `py-20 lg:py-28`. Keep the graphite band and the 4 px orange strip on top.
- **Header row** (lg: 12-col grid, items-end): "Capabilities" in display type at `text-[clamp(3.5rem,9vw,8.5rem)]`
  (7 cols), with the label/range row and the intro on the right (5 cols).
- **Index:** three link cards side by side (`lg:grid-cols-3`, stacked on phones) instead of tall rows. Each card has:
  - **Shape:** `rounded-lg border-line-dark bg-graphite-raised` (or a fog/4% fill) with `p-6`.
  - **Header row:** the Doto number in signal, with an arrow on the right.
  - **Name:** the domain name in display `text-3xl`.
  - **Tools:** up to six tool pills on the dark tone, with icons.
  - **Hover and focus:** the border turns signal, the arrow nudges and the name turns signal.
- **Target height:** about 70–80% of a 900 px viewport on desktop; nothing should feel empty.

### 2. The domain chapters need colour and movement: `DomainBackdrop`

Add a decorative layer behind Front end, Back end and AI: `aria-hidden`, `pointer-events-none`, `absolute inset-0`,
`overflow-hidden`, behind the content. One component takes a discriminated `kind`, `"frontend" | "backend" | "ai"`,
and a `switch` picks the motif.

- **Colour:** each chapter gets one or two large, very soft signal-orange radial glows (opacity 0.10–0.16, blur
  ~120 px), plus a faint warm tint. They drift slowly with CSS keyframes over 18–30 s, so the paper stops feeling
  flat.
- **Motif:** a large, low-contrast SVG (ink at 5–8% opacity, with one signal accent), sitting mostly at the side of
  the content and never behind the table text at full strength.
  - **frontend:** floating wireframe UI fragments (a card, a toggle, a button, a cursor and a selection box with
    handles) that drift slowly.
  - **backend:** a sparse service network (nodes and straight links), with small orange packets travelling along a few
    links.
  - **ai:** flowing bezier strands, like a neural field, with an orange pulse running along one or two.
- **Scroll parallax:** the motif layer translates ±60 px across the chapter, via `useScroll` on the section (a
  transform only, never layout).
- **Performance and access:**
  - transforms and opacity only;
  - animations pause when the chapter is off screen (an IntersectionObserver toggles a paused class, like
    `ACTIVITY.paused` in `src/orchestra`);
  - everything is static under `prefers-reduced-motion`;
  - all text keeps WCAG AA contrast on top of it.

### 3. Skill tables: no "Where", tools as pills with icons

- Remove the Where column and `SkillArea.where` (type and content).
- **Row layout** (lg): area name and summary in 4 cols, pills in 8 cols. On phones the row stacks.
- **New `ToolPill`** (`src/ui/ToolPill.tsx`, with light and dark tones):
  - **Shape:** `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium`; light is
    `border-line-strong bg-paper/70 text-ink`, dark is `border-line-dark-strong text-fog`.
  - **Icon:** a 14 px icon on the left when one exists, `aria-hidden`, monochrome `currentColor`, so it reads as one
    system.
- **Pill group:** `ToolPills` renders a `<ul>` of pills with `flex flex-wrap gap-2`.
- **Icons** come from the `simple-icons` npm package (CC0), as tree-shaken named imports (`siReact`, …).
  - A single registry, `src/ui/icons/toolIcons.ts`, maps tool label → icon.
  - Tools without an official icon render text only; never invent a logo.
  - Known gaps: Zustand, Motion, AWS / ECS Fargate, BullMQ, Lenis, Runway, Winston and generic concepts.
  - Use: React, TypeScript, Next.js, Vite, Tailwind CSS, Radix UI, shadcn/ui, TanStack (Query), Redux (Toolkit),
    React Hook Form, Zod, GraphQL, Three.js, React Three Fiber (three.js icon), Vitest, Jest, Testing Library, Node.js,
    NestJS, Express, Fastify, OpenAPI, JWT, Nx, NATS, RabbitMQ, Socket.IO, PostgreSQL, Redis, TypeORM, Prisma,
    Drizzle, Supabase, Java (OpenJDK), Spring, Scala, WhatsApp, Zoom, Firebase, Mercado Pago, Claude (Claude Code),
    Anthropic (Anthropic SDK), Model Context Protocol (MCP SDK), Docker, Bun, GitHub.
- `ToolPills` replaces `ToolList` everywhere: skill tables, repo cards, the landmark and "Built with" on
  `/orchestra`. Delete `ToolList`.

### 4. Repository cards, restructured

The order inside each card is:

1. **Title row:** the repo name (display `text-xl md:text-2xl` semibold) on the left, and a small GitHub icon + ↗ on
   the right. For an in-progress repo, it shows a "Coming soon" chip instead.
2. **Illustration** frame.
3. **Description.**
4. **Tool pills.**

Also:
- Remove the "Repo 01/02" index, the status badge row and the footer. The whole card is still the link when the
  repo is public.
- Cards in a row share a height, and their pills align to the bottom (`mt-auto` on the pills).

### 5. "Case study" is renamed, and the animations are fixed

- **Rename:** the AI sub-section 05.3 becomes **"Featured project"**, with the caption "Orchestra in depth: how it
  works, and the board running live." Its CTA becomes "See how it works →". The `/orchestra` hero label "Case study"
  becomes "Featured project". Code folder names can stay.
- **Frozen drawings:** the drawings that move an element along a path with CSS `offset-path` do not move in Chrome.
  This was measured: the departments packet keeps the same position while its animation is "running". The fix:
  - move them with SVG `<animateMotion>` along the same path, rendered only when motion is not reduced (a tiny
    client leaf using `useReducedMotion`), or use transform keyframes for straight segments;
  - check every drawing in `src/ui/illustrations` for the same problem.
- **Board pacing on `/orchestra`:** the board runs all ten steps in about two viewports of scroll, so a normal scroll
  races through it. Make the board section 520dvh, so each step gets about 0.4 of a viewport, and keep the readout
  reaching 10/10 just before the pin releases.

## v2.8 — Brand-colour pills, bold visuals instead of backdrops, no "generated" labels (WP-B)

The owner's review (2026-11-17):

- The pills need colour: each icon on a circle in the library's own brand colour.
- He doesn't like the faint `DomainBackdrop` layers. He wants bold components and visual supports instead.
- Every decorative code or number that makes the site read as AI-made goes: "02", "Rev. 2026.11", "LG—01 Portfolio
  & CV", "Scroll", the 03/04/05 numbering and so on. Accent colour goes on the titles instead of on numbers.

### 1. Brand-colour pills

- **Brand icon:** each pill starts with a 20 px circle filled with the brand's colour (Simple Icons ships it as
  `hex`). The 12 px icon inside is white or near-black (`#111`), whichever has the higher WCAG contrast against
  that colour. A pure, tested `BrandSwatch` helper does the choice from the hex.
- **Fallback:** tools without an icon get the same 20 px circle in a neutral tint (light: `ink/8`; dark:
  `fog/12`), with the first letter of the label in 10 px semibold, so every pill has the same rhythm.
- **Dark tone:** circles get a 1 px `fog/20` ring, so black brands (Next.js, Express, GitHub, shadcn/ui) still
  read on graphite.
- **Pill shape:** `rounded-full border pl-1 pr-3 py-1 gap-2`, with the circle inset in the pill. The text stays ink
  (light) or fog (dark).

### 2. Remove the backdrops, add one bold "feature panel" per domain

- **Delete `DomainBackdrop`** and everything it needs: motifs, keyframes, the `MotifInk` constant and the tests.
  Keep the darker `--color-mute`.
- **Header layout:** each domain chapter's header becomes two columns on lg. The heading and intro go on the left
  (5 cols) and a **feature panel** on the right (7 cols). On phones the panel sits under the intro.
- **Panel:** a `rounded-2xl` graphite card (`bg-graphite text-fog`, `p-6 md:p-8`, about 340–400 px tall) that
  shows a bold, colourful, real-looking component made in code. It is not a faint drawing. Brand colour comes from
  the same brand swatches as the pills. Each panel has at most one gentle looping motion, paused off screen and
  static under reduced motion.
  - **Front end, "a design system at work":** a small stack of real UI components rendered with Tailwind, slightly
    overlapping, with soft shadows:
    - a profile or notification card;
    - a working toggle switch (clickable);
    - a segmented control;
    - a progress ring;
    - a row of colour-token swatches labelled with their names.

    Motion: the progress ring fills on a loop, or the toggle flips by itself every few seconds until the visitor
    clicks it.
  - **Back end, "a request, end to end":** a bold architecture diagram on the graphite card. Client → API gateway →
    three service boxes (Orders, Payments, Inventory) → a NATS bus bar → PostgreSQL and Redis stores. The service and
    store nodes carry their brand swatch (NestJS, NATS, PostgreSQL, Redis icons), with fog-on-graphite labels and
    orange request packets moving along the links. No fake metrics.
  - **AI, "an agent loop":** a chat-style panel. A user message ("Make shot 3 a close-up"), then an assistant turn
    with a tool-call chip (`update_shot · framing → close-up`) showing the Claude swatch, then a result card (a
    storyboard frame that updates), plus MCP and Anthropic swatches as "tools". Motion: the steps appear in turn on a
    loop, with a typing caret.
- These panels must look like product UI, crisp and confident. No decoration for its own sake.

### 3. Remove the "generated" labels and numbering

- **Hero (`SheetFrame`, `PortraitFrame`):** remove the crop marks, the code + title ("LG—01 — Portfolio & CV"), the
  revision ("Rev. 2026.11"), the "Scroll" indicator and "FIG. 01 — PORTRAIT". Remove `Hero.sheet` from the content
  and its type. The portrait frame's ring and ticks can stay if they read as design rather than annotation.
- **Chapter headers:** remove the `index` prop and its use everywhere, including `SectionHeader` itself and
  Contact's `CHAPTER_NUMBER`. Where a domain chapter's eyebrow label just says "Capabilities" above "Front end",
  remove it. Other chapters keep a plain word label (e.g. "Build log", "Contact") without a number.
- **Capabilities band:** remove the label/range row ("Capabilities", "03 — 05") and the 03/04/05 numbers on the
  cards. The accent moves to the titles: card names in `text-signal`, and the word "Capabilities" keeps fog.
- **Sub-sections:** `SubsectionHeader` loses `number` and `count`. The title carries the accent: a small `bg-signal`
  square, cap-height and set before the title, or the title's first word in signal. Pick the one that reads best and
  use it everywhere. Remove `countUnits` and `twoDigits` where they become unused.
- **`/orchestra`:**
  - remove the section numbers 01–08, the `PointList` and `DepartmentGrid` index numbers, and the board's "05.3 — Live
    demo" label (the label becomes "Live demo");
  - stats render without zero padding: "7 Departments", "16 Agents", "3 Parallel workflows";
  - `BulletList` principle numbers become a small signal dash or square.
- **Kept, because they carry meaning:** the timeline years, the Orchestra step readout (05/10), the dates, and real
  counts in prose.

## v2.9 — The feature panels become toys (WP-T1, WP-T2, WP-T3)

The owner's direction (2026-11-17): the feature panels beside Front end, Back end and AI become small interactive
**toys**. They are not tasks or puzzles: nothing to win, no score, no bugs to find. They are cute, pleasant and
on-topic, something a visitor pokes at for a few seconds and enjoys. They sit on the white `FeaturePanel` (white
ground, ink text, signal orange `#ff5a1f` as the accent, brand swatches where a real tool appears). Each one:

- **Is alive on its own:** it looks finished and pleasant before anyone touches it.
- **Takes any input:** mouse, touch and keyboard, with visible focus and `aria-live` for meaningful state changes.
- **Respects reduced motion:** it still works, but nothing animates by itself and transitions are instant.
- **Pauses off screen:** ambient loops stop when the panel isn't visible (`usePanelLoop`).
- **Keeps logic in code, not components:** the logic (layout, simulation, step timeline) lives in small pure,
  tested classes. React only renders their state.
- **Fits:** it stays inside the panel from 375 to 1920 px, roughly 360–440 px tall on desktop.

### Front end — "Building blocks" (WP-T1, `src/craft/`, replaces `DesignSystemPanel`)

A tiny UI builder.
- **Palette:** a row of block chips along the top or left: Avatar, Title, Text, Image, Button, Toggle, Badge,
  Rating stars.
- **Canvas:** one "phone card" area where blocks stack vertically.
- **Adding:** drag a chip into the card, or click or press Enter on it to append. The block drops in with a soft
  spring.
- **Rearranging:** blocks inside the card can be dragged to reorder, and dragged out (or a small × on focus or hover)
  to remove.
- **Real blocks:** they render as polished components: the avatar uses the owner's portrait
  (`/portrait/lucas.webp`), the toggle actually toggles, the stars can be clicked, the button presses.
- **Always good-looking:** any combination looks good thanks to consistent spacing tokens, and the card grows to a
  cap (then the oldest block is replaced, or adding is refused with a gentle shake).
- **Reset:** a small "Reset" restores the default card (Avatar, Title, Text, Button).
- **Drag and drop:** use `@dnd-kit/core` and `@dnd-kit/sortable` for accessible drag and drop, including keyboard
  dragging, or motion's `Reorder` if it covers everything. Explain the choice in the report.

### Back end — "Message queue" (WP-T2, `src/systems/`, replaces `RequestPanel`)

A live picture of a producer, a queue and three consumer services.
- **Layout:**
  - **Producer:** "Checkout" with a brand-neutral icon, on the left (or top on phones).
  - **Queue:** a broker in the middle, labelled "NATS" with its swatch, drawn as a horizontal stack of message dots,
    with its depth visible.
  - **Services:** three consumer services on the right ("Orders", "Payments", "Inventory", each with the NestJS
    swatch). Each has an "in flight" indicator, a processed counter and a status: healthy, busy, down or restarting.
- **Steady flow:** messages arrive at a steady rate with some randomness (around 1.5 per second). Each one travels
  producer → queue → a service, dealt to the least-busy healthy service. Services process at slightly different
  speeds.
- **Send burst:** a primary orange button labelled "Send 10 messages". Clicking fast floods the queue.
- **Overload and recovery:**
  - When a service's in-flight work stays over its limit for about 1.5 s, it **goes down**: it turns ink-outlined
    with an orange "down" badge and a small shake.
  - Its in-flight messages go back to the queue (they are never lost).
  - After about 2.5 s it **restarts**, showing a spinner, then comes back healthy and drains the backlog.
  - With all three down, the queue just piles up visibly and recovers as they restart.
- **Readout:** a small footer with queued, processed and restarts counts.
- **Engine:** a deterministic `QueueSimulation` class, tick-based with an injected clock and random source, so it can
  be tested with a seeded RNG. Rendering reads its snapshot on `requestAnimationFrame`. Cap the number of drawn dots
  (show "+N" beyond it) so it stays smooth.

### AI — "Tiny diffusion" (WP-T3, `src/capabilities/`, replaces `AgentPanel`)

A pretend image generator: a nod to generative video and image models.
- **Prompt chips:** three rows of single-choice chips build a prompt that is shown as a sentence ("a **lighthouse**
  at **dusk**, **wide** shot"):
  - Subject: lighthouse, ceramic vase, mountain, city;
  - Mood: dusk, night, morning, storm;
  - Framing: wide, close-up.
- **Generate:** an orange "Generate" button. The frame starts as noise and denoises over about 20 visible steps
  ("Step 7/20"), resolving into a procedural scene built from the chips: simple shapes and gradients drawn in SVG or
  canvas, with palettes per mood. It looks charming, not photographic.
- **Gallery:** each result lands in a small strip of the last four generations. Clicking one shows it again.
- **Idle state:** at rest, the panel shows a finished image from the default chips.
- **Seeds:** a small "seed" control (or a shuffle icon) re-rolls the composition with the same chips.
- **Engine:** the noise schedule and scene composition are pure and tested (`DiffusionSchedule`, `SceneRecipe`).
  Rendering is canvas or SVG, and it is cheap.
- **Copy:** the panel title is "Tiny diffusion". It must not claim to be a real model. The caption says it is a toy.

## v2.10 — An isometric UI stack and a little agent (WP-I, WP-G)

The owner's review (2026-11-17):

- **Front end:** replace "Building blocks" with an isometric 3D model in three.js that mimics a "layered UI".
- **Back end:** the queue toy plays much slower. Done: `QueueLoop` takes a playback speed, and the toy runs at 0.4.
- **AI:** "Tiny diffusion" is replaced by "Agent at work".
- **Interactivity:** not every toy has to be interactive. Watching is enough. Both new pieces are ambient first,
  with at most a light touch of interaction.

Both sit on the white `FeaturePanel` (white ground, ink text, signal orange `#ff5a1f` accent) and follow the v2.9
rules: alive on their own, static under reduced motion, paused off screen, logic in small tested classes, fitting
from 375 to 1920 px, about 360–440 px tall on desktop.

### Front end — "Layers" (WP-I, `src/craft/`, replaces `BuildingBlocksPanel` and its `blocks/` folder)

An isometric, exploded view of one screen of UI, its layers separated in depth, like a designer's "exploded" view
of a product card.
- **Scene:** react-three-fiber (already in the project; three.js, `@react-three/fiber`, `@react-three/drei`) with an
  orthographic camera at a true isometric angle, about 35.264° pitch and 45° yaw. The scene is soft, bright and
  airy: white and off-white slabs, ink hairline details, and orange for the interactive layer only.
- **Layers:** five thin rounded slabs with a small thickness and soft shadows (contact shadows or a baked shadow
  plane), stacked bottom to top. Each layer's content is drawn with simple meshes, or crisp canvas textures at
  device-pixel resolution, never blurry:
  1. **Tokens:** a ground slab with a faint grid and a row of colour and radius swatches.
  2. **Layout:** wireframe boxes of the card's regions (header, media, body, actions).
  3. **Components:** an avatar circle, a title bar, a toggle and a button as filled shapes.
  4. **Content:** text lines and a small image block.
  5. **Interaction:** an orange focus ring around the button, a cursor, and a small ripple.
- **Motion loop** (about 8 s): the layers breathe from a tight stack (almost one card) to a wide exploded stack and
  back, eased, with a slight stagger. The whole model rotates very slowly, ±8° around the vertical axis, never a full
  spin.
- **Labels:** small ink labels with a hairline leader line ("Tokens", "Layout", "Components", "Content",
  "Interaction") fade in beside each layer when exploded. These are HTML (drei `Html`) or crisp sprites.
- **Light touch:** hovering the panel tilts the model a few degrees toward the pointer, with damping. No click
  interaction is required.
- **Performance:**
  - one `Canvas`, `dpr` capped at 2;
  - `frameloop="demand"`, or rendering paused while off screen (via `usePanelLoop`);
  - the scene's geometry built once;
  - under reduced motion, a still exploded frame;
  - a static fallback (an SVG or image of the exploded stack) while the WebGL context loads or if it fails.
- **Logic:** the stack choreography (layer offsets for a time t, the stagger and the ease) and the isometric
  projection helpers are pure and tested.

### AI — "Agent at work" (WP-G, `src/capabilities/`, replaces `diffusion/` and `TinyDiffusionPanel`)

A tiny, cute agent character carrying a ticket around a row of little tool stations, like a mini Orchestra. It is
pure ambient animation that is fun to watch.
- **The agent:** a small friendly character drawn in SVG: a rounded body in ink with a white face, two dot eyes that
  blink, a small orange antenna light, and a ticket card it carries. It bobs slightly while walking, and its eyes
  look toward the next station.
- **Stations:** four small desks or kiosks in a row (two by two on phones), each with an icon and a label:
  1. **"Read"** (a document)
  2. **"Search"** (a magnifier)
  3. **"Code"** (brackets)
  4. **"Test"** (a check)
  Then a final **"Ship"** mailbox or rocket.
- **Loop** (about 14 s):
  1. The agent picks up a ticket ("F-12 · dark mode", from a small rotating list of plausible tickets).
  2. It walks station to station. At each one a speech bubble shows the tool call in a monospace-free label style,
     e.g. `read_file("theme.ts")`, `search("prefers-color-scheme")`, `edit("theme.ts")`, `run_tests() · 24 passed`.
     The station lights up orange while it works.
  3. At Ship it drops the ticket in, a small confetti or check pop plays, a "Shipped" counter ticks up, and it walks
     back for the next ticket.
- **Rare moment:** about one loop in four, a test fails ("1 failed"). The agent does a small head-shake, walks back
  to Code, fixes it, and the tests pass. It is charming and shows the agent correcting itself.
- **Light touch:** clicking the agent makes it wave and say "hi!" in a bubble. That is the only interaction, and it
  is not needed.
- **Logic:** the choreography is a pure, tested `AgentRoute` or timeline (positions and states for a time t, the
  ticket rotation, the occasional retry with a seeded RNG). React renders positions with transforms only.
- **Copy:** the panel title is "Agent at work". The caption is one plain line, e.g. "An agent takes tickets through
  its tools: read, search, code, test, ship."

## v2.11 — The Front end workbench room (WP-R1, prototype)

The owner's direction (2026-11-17): the Front end header felt flat, with text on one side and a 3D panel on the
other. It becomes one pinned, full-width 3D scene, a soft clay-render isometric workbench room that depicts great UI.
The heading lives inside the moment, and Skills, Repositories and the live demo continue below it unchanged. This
package is a **prototype**: it proves the room, the camera move and the live screen, so the owner can judge the feel
before detail polish.

### Structure
- `CraftChapter` becomes: a `WorkbenchRoom` section, then the existing Skills, Repositories and live demo blocks.
- `DomainHeader`/`LayersPanel` are no longer used for Front end. Delete `LayersPanel` and `src/craft/layers/` unless
  their geometry is reused for the floating cards; reuse is encouraged.
- **Pinning:** the room is a tall section (about 300dvh) with a sticky, full-viewport stage. Its progress comes from
  `ElementScrollProgress` (in `src/story`), exactly like the `/orchestra` board.
- **Heading:** "Front end" and the intro are HTML laid over the scene (left side, large), so they stay selectable,
  accessible and crisp. They fade and drift up as the camera moves in.

### The scene (react-three-fiber + drei, all geometry built in code; no downloaded models, HDRs or textures)
- **Look:** a soft clay render. Matte off-white and paper materials, ink for dark parts, signal orange `#ff5a1f` as
  the one accent, gentle ambient occlusion, and soft contact shadows. The lighting comes from procedural drei
  `Lightformer`s inside `<Environment>` (no network HDR) plus one warm key light from the desk lamp. It must feel
  premium and calm, like a polished product render, not a game.
- **The room:** an isometric cut-away diorama, a floor plinth plus two walls, sitting on the page's paper colour.
  Inside it:
  - **Desk:** a rounded wooden-clay top on legs.
  - **Monitor:** a thin bezel on a stand. Its screen is a **live React interface** rendered with drei
    `<Html transform>` (or `occlude`), crisp and interactive: a mini product dashboard in the site's style, with a
    sidebar, a list of conversations, a working toggle, a small chart and an orange primary button. Real DOM, so the
    visitor can click it.
  - **Desk props:** a keyboard (key grid, one orange key), a mug, a small plant, and a desk lamp casting warm light.
  - **Pegboard wall:** UI components as chunky 3D tiles: a button, a toggle, an avatar, a slider, a checkbox and a
    rating, some with orange accents.
  - **Floating UI cards:** two or three cards near the monitor that **explode into their layers** as the camera
    approaches (the v2.10 Layers idea: tokens, layout, components, content, interaction).
- **Camera path,** driven by pinned scroll progress p from 0 to 1 and eased:
  - **0 – 0.25:** a wide isometric establishing shot, with the heading big on the left.
  - **0.25 – 0.7:** the camera dollies and rotates gently toward the desk while the floating cards explode.
  - **0.7 – 1:** it pushes into the monitor until the screen fills the stage, then the stage fades to the paper
    colour as the Skills section arrives.
- **Small life:** idle motion, such as a gentle float on the cards, a lamp flicker that is barely there, and a slight
  pointer parallax of a few degrees.

### Performance and fallbacks
- One `<Canvas>`. Render only while the room is on screen (`frameloop` on demand off screen), with `dpr` capped at
  2. Merge static geometry where possible. Contact shadows are rendered once, or rarely, not every frame.
- **Phones (< 768 px):** no pin and no dolly. A shorter section with the wide establishing shot as a live canvas at
  lower `dpr` (or a still), the monitor showing the same UI as HTML, and the heading above it.
- **Reduced motion:** no camera path; the wide shot as a still scene. The live screen still works.
- **Before WebGL or on failure:** a clean, static fallback (the heading plus a simple drawing). Never a blank box.

### Logic (pure, tested)
- `CameraPath`: keyframes mapping p to camera position, target and zoom/fov, with easing between them.
- `RoomLayout`: the props' positions and sizes in one place.
- Explode timing for the cards, as a function of p.
- One composition root; nothing at module load.
