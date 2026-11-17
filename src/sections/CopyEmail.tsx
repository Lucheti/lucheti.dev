"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const COPY_LABEL = "Copy";
const COPIED_LABEL = "Copied";
const ANNOUNCEMENT = "Email address copied to the clipboard";
const COPIED_FOR_MS = 2000;

/** The address in mono type with a button that copies it. Does nothing when the clipboard is unavailable. */
export function CopyEmail({ email }: { readonly email: string }): ReactNode {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (): Promise<void> => {
    if (typeof navigator === "undefined" || navigator.clipboard === undefined) {
      return;
    }
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return;
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_FOR_MS);
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="font-label text-sm text-ink md:text-[15px]">{email}</span>
      <button
        type="button"
        onClick={() => void copy()}
        className="h-8 rounded-[3px] border border-line-strong px-3 font-label font-medium text-[11px] uppercase tracking-[0.14em] text-ink transition-colors duration-300 ease-out-expo hover:border-ink"
      >
        {copied ? COPIED_LABEL : COPY_LABEL}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? ANNOUNCEMENT : ""}
      </span>
    </div>
  );
}
