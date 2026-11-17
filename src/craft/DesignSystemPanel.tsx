"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ColourToken, DesignSystemPanel as DesignSystemContent } from "@/content";
import { cx, FeaturePanel, ToolSwatch, usePanelLoop } from "@/ui";

/** How often the switch flips by itself, until the visitor uses it. */
const FLIP_MS = 2600;

const RING_RADIUS = 22;
const RING_STROKE = 6;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** A light component floating on the graphite card; each use sets its own radius. */
const SURFACE = "bg-paper-raised text-ink shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)] ring-1 ring-ink/5";

/** The tools behind the system, as overlapping brand swatches. */
function SwatchStack({ tools }: Readonly<{ tools: readonly string[] }>): ReactNode {
  return (
    <span aria-hidden className="flex shrink-0 items-center">
      {tools.map((tool, position) => (
        <span key={tool} className={cx("rounded-full bg-graphite p-0.5", position > 0 && "-ml-2")}>
          <ToolSwatch tool={tool} tone="dark" size="md" />
        </span>
      ))}
    </span>
  );
}

type NotificationProps = Readonly<{ notification: DesignSystemContent["notification"]; muted: boolean }>;

/** A notification card; it greys out while alerts are off. */
function Notification({ notification, muted }: NotificationProps): ReactNode {
  return (
    <div
      className={cx(
        SURFACE,
        "flex items-start gap-3 rounded-xl p-4 transition-[opacity,filter] duration-500 ease-out-expo",
        muted && "opacity-60 grayscale",
      )}
    >
      <ToolSwatch tool={notification.from.tool} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-semibold">{notification.from.name}</span>
          <span className="shrink-0 text-xs text-ink-soft">{notification.time}</span>
        </p>
        {notification.from.detail ? <p className="truncate text-xs text-ink-soft">{notification.from.detail}</p> : null}
        <p className="mt-1.5 text-[13px] leading-snug text-ink">{notification.message}</p>
      </div>
    </div>
  );
}

type AlertSwitchProps = Readonly<{ label: string; on: boolean; onToggle: () => void }>;

/** A working switch: a real button with role="switch". */
function AlertSwitch({ label, on, onToggle }: AlertSwitchProps): ReactNode {
  const labelId = useId();
  return (
    <div
      className={cx(
        SURFACE,
        "relative z-10 -mt-3 ml-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3 sm:-mr-3",
      )}
    >
      <span id={labelId} className="min-w-0 truncate text-[13px] font-medium sm:text-sm">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        onClick={onToggle}
        className={cx(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ease-out-expo",
          on ? "bg-signal" : "bg-ink/20",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-paper-raised shadow-sm transition-transform duration-300 ease-out-expo",
            on && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

/** A segmented control: buttons in a group, the pressed one filled. */
function Segments({ segments }: Readonly<{ segments: DesignSystemContent["segments"] }>): ReactNode {
  const [selected, setSelected] = useState(0);
  return (
    <div role="group" aria-label={segments.label} className={cx(SURFACE, "flex gap-1 rounded-full p-1")}>
      {segments.options.map((segment, position) => (
        <button
          key={segment}
          type="button"
          aria-pressed={selected === position}
          onClick={() => setSelected(position)}
          className={cx(
            "min-w-0 flex-1 truncate rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors duration-300 ease-out-expo",
            selected === position ? "bg-ink text-paper-raised" : "text-ink-soft hover:text-ink",
          )}
        >
          {segment}
        </button>
      ))}
    </div>
  );
}

/** A progress ring with its figure in the middle. */
function ProgressRing({ progress }: Readonly<{ progress: DesignSystemContent["progress"] }>): ReactNode {
  const box = 2 * (RING_RADIUS + RING_STROKE / 2);
  const gap = RING_LENGTH * (1 - progress.percent / 100);
  return (
    <div className={cx(SURFACE, "flex items-center gap-4 rounded-xl p-4")}>
      <div className="relative shrink-0">
        <svg aria-hidden viewBox={`0 0 ${box} ${box}`} className="size-14 -rotate-90">
          <circle cx={box / 2} cy={box / 2} r={RING_RADIUS} fill="none" strokeWidth={RING_STROKE} className="stroke-ink/10" />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={gap}
            className="stroke-signal"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold tabular-nums">
          {progress.percent}%
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{progress.label}</p>
        <p className="truncate text-xs text-ink-soft">{progress.detail}</p>
      </div>
    </div>
  );
}

/** The colour tokens behind the components, each a chip with its name. */
function Tokens({ tokens }: Readonly<{ tokens: readonly ColourToken[] }>): ReactNode {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-3 sm:gap-x-5">
      {tokens.map((token) => (
        <li key={token.name} className="flex flex-col items-start gap-1.5">
          <span aria-hidden className="block size-8 rounded-lg ring-1 ring-inset ring-fog/15" style={{ backgroundColor: token.hex }} />
          <span className="text-[11px] font-medium text-fog-dim">{token.name}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The front end's feature panel: a few components of a design system, working. The alerts switch flips
 * by itself every few seconds while the panel is on screen, until the visitor uses it.
 */
export function DesignSystemPanel({ panel }: Readonly<{ panel: DesignSystemContent }>): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const running = usePanelLoop(rootRef);
  const [alertsOn, setAlertsOn] = useState(true);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!running || touched) {
      return undefined;
    }
    const timer = window.setInterval(() => setAlertsOn((on) => !on), FLIP_MS);
    return () => window.clearInterval(timer);
  }, [running, touched]);

  const toggle = (): void => {
    setTouched(true);
    setAlertsOn((on) => !on);
  };

  return (
    <FeaturePanel label={panel.label} title={panel.title} aside={<SwatchStack tools={panel.stack} />}>
      <div ref={rootRef} className="flex flex-1 flex-col justify-between gap-6">
        <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr] sm:items-start">
          <div className="min-w-0">
            <Notification notification={panel.notification} muted={!alertsOn} />
            <AlertSwitch label={panel.toggle} on={alertsOn} onToggle={toggle} />
          </div>
          <div className="flex min-w-0 flex-col gap-4">
            <Segments segments={panel.segments} />
            <div className="hidden sm:block">
              <ProgressRing progress={panel.progress} />
            </div>
          </div>
        </div>
        <Tokens tokens={panel.tokens} />
      </div>
    </FeaturePanel>
  );
}
