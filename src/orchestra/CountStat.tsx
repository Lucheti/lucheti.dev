"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Stat } from "@/content";
import { cx } from "@/ui";
import { CountValue } from "./CountValue";

type CountStatProps = Readonly<{
  stat: Stat;
  shown: boolean;
  /** Seconds to hold back the arrival, for a stagger. */
  delay: number;
}>;

const COUNT_SECONDS = 0.8;

/** A dot-matrix figure that counts up from zero each time it appears. */
export function CountStat({ stat, shown, delay }: CountStatProps): ReactNode {
  const reducedMotion = useReducedMotion() === true;
  const [count] = useState(() => CountValue.parse(stat.value));
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = valueRef.current;
    if (count === undefined || element === null) {
      return undefined;
    }
    if (!shown || reducedMotion) {
      element.textContent = count.at(shown ? 1 : 0);
      return undefined;
    }
    const controls = animate(0, 1, {
      duration: COUNT_SECONDS,
      delay,
      ease: "easeOut",
      onUpdate: (fraction) => {
        element.textContent = count.at(fraction);
      },
    });
    return () => controls.stop();
  }, [count, shown, reducedMotion, delay]);

  return (
    <div
      className={cx(
        "transition-[opacity,transform] duration-700 ease-out-expo motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
      style={{ transitionDelay: shown ? `${delay}s` : "0s" }}
    >
      <p
        className="font-dot text-[clamp(2.5rem,min(6vw,9dvh),5rem)] font-black leading-none text-fog"
        aria-label={stat.value}
      >
        <span ref={valueRef} aria-hidden>
          {count ? count.at(0) : stat.value}
        </span>
      </p>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fog-dim">{stat.label}</p>
    </div>
  );
}
