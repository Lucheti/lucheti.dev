import type { ChapterId } from "@/story";

export type Link = Readonly<{
  label: string;
  href: string;
}>;

export type NavItem = Readonly<{
  label: string;
  chapter: ChapterId;
}>;

export type Fact = Readonly<{
  label: string;
  value: string;
}>;

export type Hero = Readonly<{
  eyebrow: string;
  /** One entry per display line; the last line takes the accent treatment. */
  headline: readonly string[];
  lede: string;
  primary: Link;
  secondary: Link;
  facts: readonly Fact[];
}>;

export type MethodStep = Readonly<{
  number: string;
  title: string;
  claim: string;
  proof: string;
  /** Where the proof comes from, e.g. a company name. */
  source: string;
}>;

export type Method = Readonly<{
  label: string;
  heading: string;
  intro: string;
  steps: readonly MethodStep[];
}>;

export type CaseStudy = Readonly<{
  company: string;
  role: string;
  period: string;
  headline: string;
  summary: string;
  highlights: readonly string[];
  tags: readonly string[];
}>;

export type Work = Readonly<{
  label: string;
  heading: string;
  intro: string;
  cases: readonly CaseStudy[];
}>;

export type LabProject = Readonly<{
  name: string;
  tagline: string;
  description: string;
  highlights: readonly string[];
  /** The featured project gets the large card. Exactly one should be true. */
  featured: boolean;
}>;

export type Lab = Readonly<{
  label: string;
  heading: string;
  intro: string;
  projects: readonly LabProject[];
}>;

export type Contact = Readonly<{
  label: string;
  heading: string;
  body: string;
  links: readonly Link[];
  footnote: string;
}>;

export type SiteContent = Readonly<{
  name: string;
  role: string;
  nav: readonly NavItem[];
  hero: Hero;
  method: Method;
  work: Work;
  lab: Lab;
  contact: Contact;
}>;

export type BackdropFrameSet = Readonly<{
  /** Pixel width of every frame in the set. */
  width: number;
  /** Public directory holding 0001.webp … NNNN.webp. */
  directory: string;
}>;

export type BackdropManifest = Readonly<{
  frameCount: number;
  aspectRatio: number;
  /** Ordered from the smallest set to the largest. */
  sets: readonly BackdropFrameSet[];
}>;
