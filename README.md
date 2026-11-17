# lucheti.dev

The portfolio of Lucas Garcia, product engineer. Live at **[lucheti.dev](https://lucheti.dev)**.

It is one scroll-driven page: a hero with a framed portrait and a WebGL object, a pinned horizontal career timeline,
then the front-end, back-end and AI capabilities, each with a skill table, repositories and a live demo.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict)
- **Tailwind CSS 4** for styling, with the design tokens in `src/app/globals.css`
- **React Three Fiber / three.js** for the 3D object
- **Motion** and **Lenis** for scroll-linked animation and smooth scrolling
- **Vitest** for the unit tests

## How it is built

- **One scroll story.** `src/story` turns scroll position into per-chapter progress. Every animation (the timeline
  track, the 3D object's pose, the pinned boards) reads from that one source instead of measuring the page itself.
- **Logic out of components.** Geometry, sequencing and layout rules are plain classes with tests: for example
  `TimelineGeometry`, `PoseTrack` and `SpecAnnotator`. Components only render.
- **Content as data.** Every word on the site lives in `src/content/site.ts`, typed in `src/content/types.ts`.
- **Accessible by default.** It uses real landmarks and tables, has visible focus, supports keyboard navigation, and
  every animation honours `prefers-reduced-motion`.

| Folder | What it holds |
|---|---|
| `src/story` | Scroll story: chapters, progress signals, smooth scroll |
| `src/artifact` | The WebGL object and its per-chapter poses |
| `src/timeline` | The pinned build log with milestones |
| `src/capabilities` | The capabilities landmark and the AI chapter |
| `src/craft` | Front end chapter and the spec-annotated component demo |
| `src/ui` | Shared parts: section headers, skill table, repo cards, drawings |
| `src/content` | All copy and its types |

## Run it

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm gate     # typecheck, lint, tests and production build
```
