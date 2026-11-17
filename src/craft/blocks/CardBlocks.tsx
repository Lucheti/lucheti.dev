"use client";

import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { BlockKind, BuildingBlocksPanel } from "@/content";
import { cx } from "@/ui";
import { assertNever } from "./assertNever";
import { fillTemplate } from "./BlockAnnouncer";
import { StarRating } from "./StarRating";

type BlockCopy = BuildingBlocksPanel["copy"];

const STARS = 5;
const FIRST_RATING = 4;

/** The owner's portrait on the orange disc, as in the hero, with his name and role. */
function AvatarBlock({ copy }: Readonly<{ copy: BlockCopy["avatar"] }>): ReactNode {
  return (
    <div className="flex h-9 items-center gap-2.5">
      <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-signal ring-2 ring-white shadow-[0_2px_6px_-2px_rgb(14_14_14/0.35)]">
        <Image
          src="/portrait/lucas.webp"
          alt={copy.alt}
          width={128}
          height={159}
          sizes="56px"
          className="absolute left-1/2 top-[-10px] h-auto w-14 max-w-none -translate-x-1/2"
        />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] font-semibold leading-tight text-ink">{copy.name}</span>
        <span className="truncate text-[11.5px] leading-tight text-ink-soft">{copy.role}</span>
      </span>
    </div>
  );
}

function TitleBlock({ text }: Readonly<{ text: string }>): ReactNode {
  return <p className="truncate text-[17px] font-semibold leading-[22px] tracking-[-0.02em] text-ink">{text}</p>;
}

function TextBlock({ text }: Readonly<{ text: string }>): ReactNode {
  return <p className="line-clamp-2 text-[12.5px] leading-[19px] text-ink-soft">{text}</p>;
}

/** A small drawn sunset: an orange sun setting behind two hills, with a caption chip. */
function ImageBlock({ copy }: Readonly<{ copy: BlockCopy["image"] }>): ReactNode {
  const sky = useId();
  return (
    <div className="relative h-[72px] overflow-hidden rounded-xl ring-1 ring-inset ring-ink/5">
      <svg role="img" aria-label={copy.alt} viewBox="0 0 240 72" preserveAspectRatio="xMidYMid slice" className="size-full">
        <defs>
          <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe3d3" />
            <stop offset="1" stopColor="#fff6ef" />
          </linearGradient>
        </defs>
        <rect width="240" height="72" fill={`url(#${sky})`} />
        <circle cx="168" cy="44" r="17" fill="#ff5a1f" />
        <path d="M0 52c34-14 64-18 98-8s58 10 86-2 42-12 56-8v38H0z" fill="#ffb08c" />
        <path d="M0 62c28-10 54-12 84-4s60 8 92-2 48-8 64-4v20H0z" fill="#0e0e0e" />
      </svg>
      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-medium text-ink shadow-sm">
        {copy.caption}
      </span>
    </div>
  );
}

/** A primary button that presses: orange, then ink with a tick once pressed. */
function ButtonBlock({ copy }: Readonly<{ copy: BlockCopy["button"] }>): ReactNode {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => setPressed((was) => !was)}
      className={cx(
        "flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold shadow-[inset_0_-2px_0_rgb(14_14_14/0.14)] transition-[background-color,color,transform] duration-200 ease-out-expo active:scale-[0.97] motion-reduce:transition-none",
        pressed ? "bg-ink text-white" : "bg-signal text-ink hover:brightness-105",
      )}
    >
      {pressed ? (
        <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m3.5 8.5 3 3 6-7" />
        </svg>
      ) : null}
      {pressed ? copy.pressed : copy.idle}
    </button>
  );
}

/** A settings row with a working switch. */
function ToggleBlock({ label }: Readonly<{ label: string }>): ReactNode {
  const [on, setOn] = useState(true);
  const labelId = useId();
  return (
    <div className="flex h-9 items-center justify-between gap-3 rounded-xl bg-paper px-3">
      <span id={labelId} className="truncate text-[13px] font-medium text-ink">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        onClick={() => setOn((was) => !was)}
        className={cx(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-300 ease-out-expo motion-reduce:transition-none",
          on ? "bg-signal" : "bg-ink/20",
        )}
      >
        <span
          aria-hidden
          className={cx(
            "absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-[0_1px_3px_rgb(14_14_14/0.3)] transition-transform duration-300 ease-out-expo motion-reduce:transition-none",
            on && "translate-x-4",
          )}
        />
      </button>
    </div>
  );
}

function BadgeBlock({ text }: Readonly<{ text: string }>): ReactNode {
  return (
    <div className="flex h-6 items-center">
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-signal-soft px-2.5 text-[11.5px] font-semibold text-signal-ink">
        <span aria-hidden className="size-1.5 rounded-full bg-signal" />
        {text}
      </span>
    </div>
  );
}

/** Five stars as a radio group: click or hover with the pointer, arrows with the keyboard. */
function RatingBlock({ copy }: Readonly<{ copy: BlockCopy["rating"] }>): ReactNode {
  const [rating, setRating] = useState(() => new StarRating(STARS, FIRST_RATING));
  const [preview, setPreview] = useState<number | null>(null);
  const [rated, setRated] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const choose = (next: StarRating): void => {
    setRating(next);
    setRated(true);
    groupRef.current?.querySelector<HTMLElement>(`[data-star="${next.value()}"]`)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const next = rating.press(event.key);
    if (next === null) {
      return;
    }
    event.preventDefault();
    choose(next);
  };

  return (
    <div className="flex h-6 items-center justify-between gap-3">
      <div
        ref={groupRef}
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setPreview(null)}
        className="flex items-center"
      >
        {rating.stars().map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            data-star={star}
            aria-checked={rating.value() === star}
            aria-label={fillTemplate(copy.star, { position: star, count: STARS })}
            tabIndex={rating.value() === star ? 0 : -1}
            onClick={() => choose(rating.rate(star))}
            onMouseEnter={() => setPreview(star)}
            className="rounded-[4px] p-[3px] transition-transform duration-150 ease-out-expo hover:scale-115 active:scale-95 motion-reduce:transition-none"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-[18px]">
              <path
                d="m8 1.6 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.4l-3.8 2 .7-4.3-3.1-3 4.3-.6z"
                strokeLinejoin="round"
                strokeWidth={1}
                className={cx(
                  "transition-colors duration-150 motion-reduce:transition-none",
                  rating.isLit(star, preview) ? "fill-signal stroke-signal" : "fill-ink/12 stroke-ink/12",
                )}
              />
            </svg>
          </button>
        ))}
      </div>
      <span id={labelId} className="truncate text-[11.5px] font-medium text-ink-soft">
        {rated ? copy.thanks : copy.label}
      </span>
    </div>
  );
}

type CardBlockViewProps = Readonly<{ kind: BlockKind; copy: BlockCopy }>;

/** A block as it shows on the phone card: a small, real, working component. */
export function CardBlockView({ kind, copy }: CardBlockViewProps): ReactNode {
  switch (kind) {
    case "avatar":
      return <AvatarBlock copy={copy.avatar} />;
    case "title":
      return <TitleBlock text={copy.title} />;
    case "text":
      return <TextBlock text={copy.text} />;
    case "image":
      return <ImageBlock copy={copy.image} />;
    case "button":
      return <ButtonBlock copy={copy.button} />;
    case "toggle":
      return <ToggleBlock label={copy.toggle} />;
    case "badge":
      return <BadgeBlock text={copy.badge} />;
    case "rating":
      return <RatingBlock copy={copy.rating} />;
    default:
      return assertNever(kind);
  }
}
