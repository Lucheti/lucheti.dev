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

export type Portrait = Readonly<{
  /** A cutout with a transparent background. */
  src: string;
  alt: string;
  width: number;
  height: number;
}>;

export type Hero = Readonly<{
  /** First and last name, set on two display lines. */
  name: readonly [string, string];
  role: string;
  /** One factual sentence under the role. */
  summary: string;
  portrait: Portrait;
  facts: readonly Fact[];
  primary: Link;
  secondary: Link;
  /** Corner annotations of the spec-sheet frame. */
  sheet: Readonly<{ code: string; title: string; revision: string; scroll: string }>;
}>;

export type Era = "pre-ai" | "ai";

export type TimelineStop = Readonly<{
  /** Four-digit year shown in dot-matrix numerals. */
  year: string;
  /** When it started, e.g. "Oct 2019" or "Now". */
  period: string;
  company: string;
  role: string;
  /** What I did. One sentence. */
  did: string;
  /** What the industry was doing. One sentence. */
  trend: string;
  era: Era;
}>;

export type MilestoneKind = "promotion" | "move";

/** A promotion or company change, drawn between the stop before it and the stop after it. */
export type TimelineMilestone = Readonly<{
  /** e.g. "Aug 2021". */
  date: string;
  kind: MilestoneKind;
  /** Short, e.g. "AMTS → MTS". */
  label: string;
  /** One short sentence. */
  note: string;
  /** The milestone sits between stop `afterStop` and the stop after it. */
  afterStop: number;
}>;

export type Timeline = Readonly<{
  label: string;
  heading: string;
  intro: string;
  lanes: Readonly<{ world: string; me: string }>;
  eras: Readonly<Record<Era, string>>;
  stops: readonly TimelineStop[];
  milestones: readonly TimelineMilestone[];
  milestoneKinds: Readonly<Record<MilestoneKind, string>>;
}>;

export type SpecNote = Readonly<{
  /** Stable key the specimen uses to place the annotation. */
  id: "padding" | "radius" | "type" | "contrast" | "focus" | "motion" | "role";
  label: string;
  value: string;
}>;

/** One row of a resume skill table. */
export type SkillArea = Readonly<{
  name: string;
  /** One short line. */
  summary: string;
  /** Libraries, frameworks and standards, most important first. */
  tools: readonly string[];
  /** Employers where this was the job; empty when it was not. */
  where: readonly string[];
}>;

/** Where a repository card points: a public repository, or one still being built. */
export type RepoStatus = Readonly<{ kind: "public"; href: string }> | Readonly<{ kind: "soon" }>;

/** Which drawing a repository card shows. */
export type RepoIllustrationKind = "node-graph" | "website" | "saga" | "job-queue" | "departments" | "storyboard";

/** A repository a recruiter can open. */
export type Repo = Readonly<{
  /** The GitHub repository name. */
  name: string;
  /** Two or three short sentences. */
  description: string;
  tools: readonly string[];
  status: RepoStatus;
  illustration: RepoIllustrationKind;
}>;

export type RepoLabels = Readonly<{
  public: string;
  soon: string;
  open: string;
  pending: string;
  item: string;
}>;

/** A capability domain: Front end, Back end or AI. */
export type Domain = Readonly<{
  label: string;
  heading: string;
  intro: string;
  areas: readonly SkillArea[];
  repos: readonly Repo[];
}>;

/** The title and caption of a numbered sub-section of a domain chapter. */
export type Subsection = Readonly<{ title: string; caption: string }>;

export type Capabilities = Readonly<{
  label: string;
  heading: string;
  intro: string;
  range: string;
  repoLabels: RepoLabels;
  subsections: Readonly<{ skills: Subsection; repos: Subsection; demo: Subsection }>;
  /** Units for the sub-section counts, e.g. "areas" in "05 areas". */
  countUnits: Readonly<{ areas: string; repos: string }>;
}>;

export type Craft = Domain &
  Readonly<{
    /** The line under the "Live demo" sub-section title. */
    demoCaption: string;
    specimen: Readonly<{ title: string; subtitle: string; status: string; action: string; switchLabel: string }>;
    notes: readonly SpecNote[];
    toggle: Readonly<{ show: string; hide: string }>;
  }>;

/** The back-end domain: skills and repositories only. */
export type Systems = Domain;

/** The AI domain; its live demo is the pinned Orchestra chapter that follows it. */
export type Ai = Domain;

export type DepartmentId = "product" | "design" | "engineering" | "qa" | "docs" | "release" | "learning";

export type Department = Readonly<{
  id: DepartmentId;
  name: string;
  /** The agents on this department's roster, head first. */
  agents: readonly string[];
}>;

/** One beat of the lifecycle: which department holds the work and who is working on it. */
export type OrchestraStep = Readonly<{
  department: DepartmentId;
  /**
   * Agents from that department's roster working in this beat. A name may
   * repeat for parallel instances. Empty means the beat is done by code, not an agent.
   */
  workers: readonly string[];
  ticket: string;
  message: string;
}>;

export type Stat = Readonly<{
  value: string;
  label: string;
}>;

export type Orchestra = Readonly<{
  label: string;
  heading: string;
  intro: string;
  principles: readonly string[];
  stats: readonly Stat[];
  departments: readonly Department[];
  /** The lifecycle of one feature, in order; scroll plays it. */
  steps: readonly OrchestraStep[];
}>;

export type Contact = Readonly<{
  label: string;
  heading: string;
  body: string;
  /** Shown as text with a copy button, and used for the mailto link. */
  email: string;
  links: readonly Link[];
  signoff: string;
  footnote: string;
}>;

export type SiteContent = Readonly<{
  name: string;
  role: string;
  description: string;
  /** IANA time zone for the live clock. */
  timeZone: string;
  city: string;
  nav: readonly NavItem[];
  hero: Hero;
  timeline: Timeline;
  capabilities: Capabilities;
  craft: Craft;
  systems: Systems;
  ai: Ai;
  orchestra: Orchestra;
  contact: Contact;
}>;

export type FrameSet = Readonly<{
  /** Pixel width of every frame in the set. */
  width: number;
  /** Public directory holding 0001.webp … NNNN.webp. */
  directory: string;
}>;

/** A video exported as numbered still frames, scrubbed by scroll. */
export type FrameSequence = Readonly<{
  frameCount: number;
  aspectRatio: number;
  /** Ordered from the smallest set to the largest. */
  sets: readonly FrameSet[];
}>;
