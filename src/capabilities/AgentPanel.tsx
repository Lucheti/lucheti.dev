"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { AgentPanel as AgentContent, PanelNode, ShotFraming, StoryboardShot } from "@/content";
import { cx, FeaturePanel, ToolSwatch, usePanelLoop } from "@/ui";
import { AgentScript } from "./AgentScript";

const SENT = AgentScript.stepOf("sent");
const CALLING = AgentScript.stepOf("calling");
const RESULT = AgentScript.stepOf("result");
const REPLY = AgentScript.stepOf("reply");

/** A dusk sky over dark ground, so the storyboard frames read as film stills. */
const SKY: CSSProperties = {
  background: "linear-gradient(180deg, #23304d 0%, #5b4468 42%, #e9825a 80%, #f4b067 100%)",
};
const SILHOUETTE = "absolute bg-[#0f0d0c]";

/** Fades a part of the conversation in when the loop reaches it; it keeps its space either way. */
function Appear({ shown, className, children }: Readonly<{ shown: boolean; className?: string; children: ReactNode }>): ReactNode {
  return (
    <div
      className={cx(
        "transition-[opacity,transform] duration-500 ease-out-expo",
        shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled framing: ${String(value)}`);
}

/** A figure against the sky, framed wide, medium or close. */
function ShotArt({ framing }: Readonly<{ framing: ShotFraming }>): ReactNode {
  switch (framing) {
    case "wide":
      return (
        <>
          <span className="absolute bottom-[22%] left-[18%] aspect-square w-[16%] rounded-full bg-[#ffd58a]/90" />
          <span className="absolute inset-x-0 bottom-0 h-[24%] bg-[#1a1512]" />
          <span className={cx(SILHOUETTE, "bottom-[44%] left-[57%] aspect-square w-[6%] rounded-full")} />
          <span className={cx(SILHOUETTE, "bottom-[22%] left-[56%] h-[23%] w-[8%] rounded-t-full")} />
        </>
      );
    case "medium":
      return (
        <>
          <span className="absolute bottom-[30%] left-[10%] aspect-square w-[20%] rounded-full bg-[#ffd58a]/90" />
          <span className={cx(SILHOUETTE, "bottom-[44%] left-[48%] aspect-square w-[15%] rounded-full")} />
          <span className={cx(SILHOUETTE, "bottom-0 left-[39%] h-[46%] w-[33%] rounded-t-[45%]")} />
        </>
      );
    case "close":
      return (
        <>
          <span className={cx(SILHOUETTE, "bottom-[24%] left-[33%] aspect-square w-[34%] rounded-full")} />
          <span className={cx(SILHOUETTE, "bottom-0 left-[10%] h-[34%] w-[80%] rounded-t-[50%]")} />
        </>
      );
    default:
      return assertNever(framing);
  }
}

type FrameProps = Readonly<{
  shot: StoryboardShot;
  framings: AgentContent["framings"];
  /** Set on the shot the tool call reframes, with whether the new framing has landed. */
  edit?: Readonly<{ framing: ShotFraming; landed: boolean }>;
}>;

/** One storyboard frame and its caption; the edited one cross-fades to its new framing and lights up. */
function Frame({ shot, framings, edit }: FrameProps): ReactNode {
  const landed = edit?.landed === true;
  const framing = landed && edit ? edit.framing : shot.framing;
  return (
    <div className="min-w-0">
      <div
        className={cx(
          "relative aspect-video overflow-hidden rounded-md transition-shadow duration-500",
          landed ? "ring-2 ring-signal" : "ring-1 ring-fog/10",
        )}
        style={SKY}
      >
        <span className={cx("absolute inset-0 transition-opacity duration-500", landed ? "opacity-0" : "opacity-100")}>
          <ShotArt framing={shot.framing} />
        </span>
        {edit ? (
          <span className={cx("absolute inset-0 transition-opacity duration-500", landed ? "opacity-100" : "opacity-0")}>
            <ShotArt framing={edit.framing} />
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 truncate text-[11px] font-medium leading-4 text-fog-dim">
        <span className="hidden text-fog sm:inline">{shot.name} · </span>
        {framings[framing]}
      </p>
    </div>
  );
}

/** A busy spinner, then a tick once the tool has answered. */
function CallStatus({ done, spinning }: Readonly<{ done: boolean; spinning: boolean }>): ReactNode {
  if (done) {
    return (
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 text-signal">
        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={cx("size-4 shrink-0 text-fog-dim", spinning && "animate-spin")}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.75" />
      <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

/** The tools the agent can reach, as small swatch pills; names from sm up. */
function ToolChips({ tools }: Readonly<{ tools: readonly PanelNode[] }>): ReactNode {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {tools.map((tool) => (
        <span
          key={tool.name}
          className="inline-flex items-center gap-1.5 rounded-full border border-line-dark-strong p-0.5 text-xs font-medium text-fog-dim sm:pr-2.5"
        >
          <ToolSwatch tool={tool.tool} tone="dark" />
          <span className="hidden sm:inline">{tool.name}</span>
        </span>
      ))}
    </span>
  );
}

type ComposerProps = Readonly<{ text: string; placeholder: string; typing: boolean; blinking: boolean }>;

/** The message box: what is being typed with its caret, or the placeholder, and a send button. */
function Composer({ text, placeholder, typing, blinking }: ComposerProps): ReactNode {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line-dark-strong bg-graphite-raised py-2 pl-3.5 pr-2">
      <p className={cx("h-6 min-w-0 flex-1 truncate text-sm leading-6", typing ? "text-fog" : "text-fog-dim")}>
        {typing ? text : placeholder}
        {typing ? (
          <span
            className={cx(
              "ml-px inline-block h-[1.1em] w-[1.5px] translate-y-[0.2em] bg-signal",
              blinking && "animate-[panel-caret_1s_linear_infinite]",
            )}
          />
        ) : null}
      </p>
      <span
        className={cx(
          "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
          typing ? "bg-signal text-graphite" : "bg-fog/10 text-fog-dim",
        )}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5">
          <path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

/**
 * The AI feature panel: a chat in which an agent is asked to reframe a shot, calls a tool and updates
 * the storyboard. The turn plays on a loop while the panel is on screen; otherwise it rests finished.
 */
export function AgentPanel({ panel }: Readonly<{ panel: AgentContent }>): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const running = usePanelLoop(rootRef);
  const [script] = useState(() => new AgentScript(panel.prompt.length));
  const [playing, setPlaying] = useState(AgentScript.finalStep());
  const [typing, setTyping] = useState(0);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number): void => {
      setPlaying(script.stepAt(now - start));
      setTyping(script.typedAt(now - start));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, script]);

  const step = running ? playing : AgentScript.finalStep();
  const typed = running ? typing : 0;

  return (
    <FeaturePanel
      label={panel.label}
      title={panel.title}
      lead={<ToolSwatch tool={panel.call.tool} tone="dark" size="md" />}
      aside={<ToolChips tools={panel.tools} />}
    >
      <div ref={rootRef} aria-hidden className="flex flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col justify-end gap-3">
          <Appear shown={step >= SENT} className="max-w-[85%] self-end">
            <p className="rounded-2xl rounded-br-md bg-fog px-4 py-2 text-sm font-medium leading-6 text-graphite">{panel.prompt}</p>
          </Appear>

          <Appear shown={step >= CALLING} className="w-full max-w-[26rem]">
            <div className="overflow-hidden rounded-xl border border-line-dark bg-graphite-raised">
              <div className="flex min-w-0 items-center gap-2.5 px-3 py-2.5">
                <ToolSwatch tool={panel.call.tool} tone="dark" />
                <p className="min-w-0 flex-1 truncate text-[13px]">
                  <span className="font-semibold text-fog">{panel.call.name}</span>
                  <span className="text-fog-dim"> · {panel.call.args}</span>
                </p>
                <CallStatus done={step >= RESULT} spinning={running && step === CALLING} />
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-line-dark p-2.5 sm:gap-2.5 sm:p-3">
                {panel.shots.map((shot, position) => (
                  <Frame
                    key={shot.name}
                    shot={shot}
                    framings={panel.framings}
                    edit={position === panel.edit.shot ? { framing: panel.edit.framing, landed: step >= RESULT } : undefined}
                  />
                ))}
              </div>
            </div>
          </Appear>

          <Appear shown={step >= REPLY}>
            <p className="text-sm leading-6 text-fog">{panel.reply}</p>
          </Appear>
        </div>

        <Composer
          text={panel.prompt.slice(0, typed)}
          placeholder={panel.placeholder}
          typing={typed > 0}
          blinking={running}
        />
      </div>
    </FeaturePanel>
  );
}
