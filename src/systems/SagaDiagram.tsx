"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { Systems } from "@/content";
import { ButtonLink, cx } from "@/ui";
import { DiagramLayout, type MutablePoint, type Orientation } from "./DiagramLayout";
import { SagaPlayback, type PlaybackListener } from "./SagaPlayback";
import {
  ANIMATED_TIMING,
  idleFrame,
  SagaSequencer,
  serviceIndex,
  STEPPED_TIMING,
  type LogTone,
  type Outcome,
  type SagaFrame,
  type SagaLabels,
  type SagaTiming,
} from "./SagaSequencer";
import { SagaStage } from "./SagaStage";
import { SpokeHighlighter } from "./SpokeHighlighter";

const VISIBLE_LOG_LINES = 6;
const AUTOPLAY_AMOUNT = 0.4;
const IDLE_WORD = "Ready";
const RUNNING_WORD = "Running";
const LABEL =
  "Saga diagram: a client request passes the API gateway to the saga orchestrator at the centre of a NATS ring, which calls the four services around it.";

const LOG_TONE_CLASSES: Readonly<Record<LogTone, string>> = {
  normal: "text-ink-soft",
  failure: "text-signal-ink",
  compensation: "text-signal-ink",
};

type Scenario = "commit" | "break";

type TokenSurface = Readonly<{
  orientation: Orientation;
  layout: DiagramLayout;
  element: RefObject<HTMLDivElement | null>;
  highlighter: SpokeHighlighter;
}>;

/** The service doing work right now, for the stretch where no token is travelling. */
function workingIndex(frame: SagaFrame): number | null {
  for (let index = 0; index < frame.statuses.length; index += 1) {
    const status = frame.statuses[index];
    if (status === "running" || status === "compensating") {
      return index;
    }
  }
  return null;
}

const BUTTON_BASE =
  "inline-flex h-11 items-center justify-center gap-3 rounded-[4px] px-5 font-mono text-xs uppercase tracking-[0.14em] transition-colors duration-300 ease-out-expo disabled:pointer-events-none disabled:opacity-40";

type ControlProps = Readonly<{
  children: ReactNode;
  mark: string;
  variant: "primary" | "secondary";
  disabled: boolean;
  onPress: () => void;
}>;

function Control({ children, mark, variant, disabled, onPress }: ControlProps): ReactNode {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      className={cx(
        BUTTON_BASE,
        variant === "primary"
          ? "bg-ink text-paper hover:bg-signal hover:text-ink"
          : "border border-line-strong text-ink hover:border-ink",
      )}
    >
      {children}
      <span aria-hidden>{mark}</span>
    </button>
  );
}

function outcomeText(outcome: Outcome, outcomes: Systems["outcomes"]): string {
  switch (outcome) {
    case "idle":
      return IDLE_WORD;
    case "running":
      return RUNNING_WORD;
    case "committed":
      return outcomes.committed;
    case "rolledBack":
      return outcomes.rolledBack;
    default: {
      const unreachable: never = outcome;
      throw new Error(`Unhandled outcome: ${String(unreachable)}`);
    }
  }
}

/** The breakable saga: two orientations of the same diagram, a player and the controls. */
export function SagaDiagram({ systems }: { readonly systems: Systems }): ReactNode {
  const { steps, edge, failingStep, controls, outcomes, repo } = systems;
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: AUTOPLAY_AMOUNT, once: true });

  const wideToken = useRef<HTMLDivElement>(null);
  const narrowToken = useRef<HTMLDivElement>(null);
  const surfaces = useMemo<readonly TokenSurface[]>(
    () => [
      { orientation: "wide", layout: DiagramLayout.create("wide", steps.length), element: wideToken, highlighter: new SpokeHighlighter() },
      {
        orientation: "narrow",
        layout: DiagramLayout.create("narrow", steps.length),
        element: narrowToken,
        highlighter: new SpokeHighlighter(),
      },
    ],
    [steps.length],
  );

  const [frame, setFrame] = useState<SagaFrame>(() => idleFrame(steps.length));
  const [running, setRunning] = useState(false);
  const playbackRef = useRef<SagaPlayback | null>(null);

  useEffect(() => {
    const point: MutablePoint = { x: 0, y: 0 };
    const listener: PlaybackListener = {
      onTick(sequencer, timeMs) {
        const current = sequencer.frameAt(timeMs);
        setFrame(current);
        const segment = sequencer.segmentAt(timeMs);
        const active = segment === null ? workingIndex(current) : (serviceIndex(segment.from) ?? serviceIndex(segment.to));
        for (const surface of surfaces) {
          surface.highlighter.activate(active);
          const token = surface.element.current;
          if (token === null) {
            continue;
          }
          if (segment === null) {
            token.style.opacity = "0";
            continue;
          }
          surface.layout.route(segment.from, segment.to).locate(segment.fractionAt(timeMs), point);
          token.dataset.tone = segment.tone;
          token.style.left = `${point.x * 100}%`;
          token.style.top = `${point.y * 100}%`;
          token.style.opacity = "1";
        }
      },
      onEnd() {
        setRunning(false);
      },
    };
    const playback = new SagaPlayback(listener);
    playbackRef.current = playback;
    return () => {
      playback.stop();
      playbackRef.current = null;
    };
  }, [surfaces]);

  const labels = useMemo<SagaLabels>(
    () => ({ client: edge.client, gateway: edge.gateway, orchestrator: edge.orchestrator }),
    [edge.client, edge.gateway, edge.orchestrator],
  );

  const play = useCallback(
    (scenario: Scenario) => {
      const playback = playbackRef.current;
      if (playback === null) {
        return;
      }
      const timing: SagaTiming = reducedMotion ? STEPPED_TIMING : ANIMATED_TIMING;
      const sequencer = new SagaSequencer(steps, scenario === "break" ? failingStep : null, labels, timing);
      setRunning(true);
      playback.play(sequencer);
    },
    [steps, failingStep, labels, reducedMotion],
  );

  const autoplayed = useRef(false);
  useEffect(() => {
    if (inView && !autoplayed.current) {
      autoplayed.current = true;
      play("commit");
    }
  }, [inView, play]);

  const visibleLog = frame.log.slice(-VISIBLE_LOG_LINES);

  return (
    <div ref={rootRef} className="flex flex-col gap-10">
      <div role="img" aria-label={LABEL} className="border-y border-line py-8 md:py-10">
        {surfaces.map((surface) => (
          <SagaStage
            key={surface.orientation}
            orientation={surface.orientation}
            layout={surface.layout}
            edge={edge}
            steps={steps}
            frame={frame}
            outcomeLabel={outcomeText(frame.outcome, outcomes)}
            tokenRef={surface.element}
            highlighter={surface.highlighter}
            className={surface.orientation === "wide" ? "hidden lg:block" : "lg:hidden"}
          />
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
        <div className="flex flex-wrap content-start gap-3">
          <Control variant="primary" mark="→" disabled={running} onPress={() => play("commit")}>
            {controls.run}
          </Control>
          <Control variant="secondary" mark="✕" disabled={running} onPress={() => play("break")}>
            {controls.fail}
          </Control>
        </div>

        <ol aria-live="polite" className="flex min-h-[8.5rem] flex-col justify-end gap-1 font-mono text-xs leading-5">
          {visibleLog.map((entry, index) => (
            <li key={frame.log.length - visibleLog.length + index} className={cx("flex flex-wrap gap-x-4", LOG_TONE_CLASSES[entry.tone])}>
              <span>{entry.route}</span>
              {entry.detail !== "" && <span className={entry.tone === "normal" ? "text-ink" : undefined}>{entry.detail}</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col items-start gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:gap-6">
        <ButtonLink href={repo.href} variant="secondary">
          {repo.label}
        </ButtonLink>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">{repo.note}</p>
      </div>
    </div>
  );
}
