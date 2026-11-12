"use client";

import type { ReactNode } from "react";
import type { NavItem } from "@/content";

type NavProps = Readonly<{
  name: string;
  items: readonly NavItem[];
  timeZone: string;
  city: string;
}>;

/** Placeholder until WP-H lands. */
export function Nav({ name }: NavProps): ReactNode {
  return <header className="fixed inset-x-0 top-0 z-40 p-4 font-mono text-xs">{name}</header>;
}
