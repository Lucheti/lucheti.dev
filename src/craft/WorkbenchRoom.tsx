"use client";

import dynamic from "next/dynamic";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import type { WorkbenchRoom as WorkbenchRoomContent } from "@/content";
import { ElementScrollProgress, MountedElement, WindowSurface } from "@/story";
import { Container, cx, Reveal } from "@/ui";
import { composeRoom } from "./room/composeRoom";
import { RoomFallback } from "./room/RoomFallback";
import { behaviourOf, pickMode } from "./room/RoomMode";
import { SceneBoundary } from "./SceneBoundary";

// WebGL has no server render; three.js and the scene are fetched only in the browser.
const RoomScene = dynamic(() => import("./room/RoomScene"), { ssr: false });

/** Tablet width and up: where the room pins and the camera moves. Matches Tailwind's `md`. */
const WIDE_QUERY = "(min-width: 768px)";
/** How far the heading drifts up as it fades, in pixels. */
const HEADING_TRAVEL = 72;

/** Where the WebGL scene stands: loading behind the fallback, drawing, or given up on. */
type SceneStatus = "loading" | "ready" | "failed";

type WorkbenchRoomProps = Readonly<{ heading: string; intro: string; room: WorkbenchRoomContent }>;

function subscribeToWidth(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isWide = (): boolean => window.matchMedia(WIDE_QUERY).matches;

/** The section's own scroll: a callback ref to attach, and the progress that reads it. */
function trackSection(): Readonly<{ attach: MountedElement["attach"]; progress: ElementScrollProgress }> {
  const element = new MountedElement();
  return { attach: element.attach, progress: new ElementScrollProgress(element, new WindowSurface(() => window)) };
}

/**
 * The Front end chapter's opening: a pinned, full-width clay diorama of a workbench room. The heading sits
 * over it, large, and drifts away as scrolling dollies the camera toward the desk, the floating UI cards come
 * apart into their layers, and the camera pushes into the monitor until its live inbox fills the stage; then
 * the stage fades to paper as the skills arrive.
 *
 * Phones get a short section with the wide shot under the heading; reduced motion holds the wide shot still.
 * A flat drawing of the room shows until WebGL has drawn, and stays if it never does.
 *
 * The composition root of the room: its layout, shots, timings and drawing are made here, once.
 */
export function WorkbenchRoom({ heading, intro, room: content }: WorkbenchRoomProps): ReactNode {
  const [{ attach, progress }] = useState(trackSection);
  const [room] = useState(composeRoom);
  const [status, setStatus] = useState<SceneStatus>("loading");
  const stageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const running = useInView(stageRef, { margin: "10% 0px 10% 0px" });
  const wide = useSyncExternalStore(subscribeToWidth, isWide, () => true);
  const reduced = useReducedMotion() === true;
  const behaviour = useMemo(() => behaviourOf(pickMode(wide, reduced)), [wide, reduced]);

  // The heading and the closing fade follow the scroll directly, by style writes rather than React state.
  useEffect(() => {
    const headingBox = headingRef.current;
    const fade = fadeRef.current;
    if (headingBox === null || fade === null) {
      return undefined;
    }
    const apply = (): void => {
      const p = behaviour.scroll ? progress.current().toNumber() : 0;
      const opacity = room.script.headingOpacity(p);
      headingBox.style.opacity = `${opacity}`;
      headingBox.style.transform = `translate3d(0, ${-room.script.headingRise(p) * HEADING_TRAVEL}px, 0)`;
      headingBox.style.visibility = opacity > 0 ? "" : "hidden";
      fade.style.opacity = `${room.script.fade(p)}`;
    };
    apply();
    return behaviour.scroll ? progress.subscribe(apply) : undefined;
  }, [behaviour, progress, room]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === "touch" || !behaviour.sway) {
      return;
    }
    const box = event.currentTarget.getBoundingClientRect();
    room.pointer.aim(event.clientX - box.left, event.clientY - box.top, box.width, box.height);
  };

  const ready = status === "ready";

  return (
    <section ref={attach} aria-labelledby="craft-heading" className="relative md:h-[320dvh] md:motion-reduce:h-dvh">
      <div
        ref={stageRef}
        onPointerMove={onPointerMove}
        onPointerLeave={() => room.pointer.release()}
        className="relative md:sticky md:top-0 md:h-dvh md:overflow-hidden"
      >
        <div
          ref={headingRef}
          className="relative z-10 will-change-transform md:pointer-events-none md:absolute md:inset-0"
        >
          <Container className="flex h-full flex-col pb-8 pt-28 md:justify-start md:pb-0 md:pt-[clamp(6rem,14dvh,9rem)] md:landscape:justify-center md:landscape:pt-0">
            <Reveal className="pointer-events-auto flex max-w-[min(36rem,40vw)] flex-col gap-6 max-md:max-w-none md:portrait:max-w-[34rem]">
              <h2
                id="craft-heading"
                className="text-balance font-display text-[clamp(3.25rem,7.4vw,8rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-ink"
              >
                {heading}
              </h2>
              <p className="max-w-[26rem] text-base leading-[1.6] text-ink-soft md:text-lg">{intro}</p>
            </Reveal>
          </Container>
        </div>

        <div ref={hostRef} className="relative isolate aspect-[4/5] w-full overflow-hidden sm:aspect-[4/3] md:absolute md:inset-0 md:aspect-auto">
          <RoomFallback
            sketch={room.sketch}
            className={cx(
              "absolute inset-[6%] transition-opacity duration-700 ease-out-expo motion-reduce:transition-none",
              "md:inset-auto md:bottom-[8%] md:left-[46%] md:right-[4%] md:top-[12%] md:portrait:left-[6%] md:portrait:right-[6%] md:portrait:top-[38%]",
              ready ? "opacity-0" : "opacity-100",
            )}
          />
          {status === "failed" ? null : (
            <div
              className={cx(
                "absolute inset-0 transition-opacity duration-700 ease-out-expo motion-reduce:transition-none",
                ready ? "opacity-100" : "opacity-0",
              )}
            >
              <SceneBoundary onError={() => setStatus("failed")}>
                <RoomScene
                  room={room}
                  screen={content.screen}
                  progress={progress}
                  behaviour={behaviour}
                  host={hostRef}
                  running={running}
                  onReady={() => setStatus("ready")}
                  onLost={() => setStatus("failed")}
                />
              </SceneBoundary>
            </div>
          )}
        </div>

        <div ref={fadeRef} aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-paper-raised opacity-0" />
        <p className="sr-only">{content.label}</p>
      </div>
    </section>
  );
}
