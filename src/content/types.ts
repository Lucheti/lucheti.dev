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
  /** Screen-reader text for the GitHub mark on a public card. */
  open: string;
  /** The chip on a card whose repository is still being built. */
  pending: string;
}>;

/** A capability domain: Front end, Back end or AI. */
export type Domain = Readonly<{
  heading: string;
  intro: string;
  areas: readonly SkillArea[];
  repos: readonly Repo[];
}>;

/** The title and caption of a sub-section of a domain chapter. */
export type Subsection = Readonly<{ title: string; caption: string }>;

export type Capabilities = Readonly<{
  heading: string;
  intro: string;
  repoLabels: RepoLabels;
  subsections: Readonly<{ skills: Subsection; repos: Subsection; demo: Subsection }>;
}>;

/** One part of a feature panel, painted with the brand swatch of the tool it runs on. */
export type PanelNode = Readonly<{
  name: string;
  /** A tool label from the icon registry; its brand colour paints the node's swatch. */
  tool: string;
  /** A short second line, e.g. "event bus". */
  detail?: string;
}>;

/** The layers of the diorama's floating UI card, bottom to top. */
export type LayerKind = "tokens" | "layout" | "components" | "content" | "interaction";

/** One task on the diorama's monitor: a couple of words and who owns it. */
export type ScreenTask = Readonly<{ name: string; owner: string }>;

/** The little app on the diorama's monitor, made for its real size: big shapes, few words. */
export type DioramaScreen = Readonly<{
  /** The app's title in its header bar. */
  title: string;
  /** The selected task at the top of the list; the stars and the checkbox act on it. */
  pinned: ScreenTask;
  /** The tasks that arrive under it, one after another, in turn. */
  incoming: readonly ScreenTask[];
  /** The word on a task that has just arrived. */
  fresh: string;
  /** What the toast says when the orange button is pressed. */
  toast: string;
  /** The small bar chart's heights, as shares of its full height; the last bar is today's and grows. */
  chart: readonly number[];
}>;

/**
 * The names of the hidden buttons that mirror the diorama's clickable pieces, for keyboard and screen
 * readers. `{count}` in `star` is replaced by the number of stars.
 */
export type DioramaControls = Readonly<{
  /** The group's name. */
  label: string;
  toggle: string;
  button: string;
  slider: string;
  star: string;
  checkbox: string;
  lamp: string;
  duck: string;
  plant: string;
  card: string;
}>;

/** The 3D diorama, parked for a later section: a little workroom you can turn and play with. */
export type Diorama = Readonly<{
  /** What the scene shows, for screen readers. */
  label: string;
  screen: DioramaScreen;
  controls: DioramaControls;
}>;

/** Where a task stands. */
export type TaskStatus = "todo" | "doing" | "done";

/** The colour of a label's dot. */
export type LabelHue = "red" | "violet" | "amber" | "blue" | "green";

/** One task in the laptop's task tracker. People, projects and labels are named by their ids. */
export type LaptopTask = Readonly<{
  /** Unique within the panel. */
  id: string;
  title: string;
  status: TaskStatus;
  project: string;
  label: string;
  owner: string;
  /** A short due date, e.g. "Today" or "Fri". */
  due: string;
}>;

/** The words around the laptop's command palette. */
export type LaptopSearch = Readonly<{
  /** The sidebar button that opens it. */
  button: string;
  placeholder: string;
  /** Group headings in the results. */
  tasks: string;
  views: string;
  /** Shown when nothing matches. */
  empty: string;
  /** The footer's key hints. */
  hints: Readonly<{ move: string; open: string; close: string }>;
  /** What the idle ghost cursor types; it should find a task. */
  sample: string;
}>;

/**
 * The Front end panel: the top-left corner of a laptop screen with a small task tracker open. Copy only;
 * the panel decides how it looks.
 */
export type Laptop = Readonly<{
  /** What the panel shows, for screen readers. */
  label: string;
  /** The app's name, bold in the menu bar. */
  app: string;
  /** The menu bar's menus after the app's name. */
  menus: readonly string[];
  /** The workspace in the sidebar's switcher. */
  workspace: string;
  /** The person the laptop belongs to: "My tasks" are theirs, and "Assign to me" gives a task to them. */
  me: string;
  people: readonly Readonly<{ id: string; name: string }>[];
  projects: readonly Readonly<{ id: string; name: string }>[];
  labels: readonly Readonly<{ id: string; name: string; hue: LabelHue }>[];
  /** The sidebar's views and the heading of its projects group. */
  views: Readonly<{ mine: string; all: string; done: string; projects: string }>;
  /** The list's group headings. */
  statuses: Readonly<Record<TaskStatus, string>>;
  /** The tasks on screen at first. */
  tasks: readonly LaptopTask[];
  /** Tasks that arrive now and then, in turn; finished tasks join the end of the line. */
  incoming: readonly LaptopTask[];
  search: LaptopSearch;
  /** A row's hover actions, and the toolbar's new-task button. */
  actions: Readonly<{ complete: string; reopen: string; assign: string; newTask: string }>;
  /** The word on a task that has just arrived. */
  fresh: string;
  /** The due date that means today; open tasks due then show it in orange. */
  today: string;
  /** Shown in a view with no tasks. */
  empty: string;
}>;

/** The back-end feature panel: a toy message queue, from a producer through a broker to consumer services. */
export type QueuePanel = Readonly<{
  label: string;
  title: string;
  /** The service that publishes the messages, and what it is. */
  producer: Readonly<{ name: string; role: string }>;
  broker: PanelNode;
  services: readonly PanelNode[];
  /** The button that sends a batch, and how many it sends. */
  send: Readonly<{ label: string; count: number }>;
  /** How each service status is written. */
  statuses: Readonly<{ healthy: string; busy: string; down: string; restarting: string }>;
  /** The footer's counters, and the words for a service's messages in flight and done. */
  readout: Readonly<{ queued: string; processed: string; restarts: string; inFlight: string; done: string }>;
  /** Live-region sentences; `{service}` and `{count}` are filled in. */
  announcements: Readonly<{ down: string; restarting: string; recovered: string; settled: string }>;
}>;

/** A stop on the agent's round: where tickets wait, its four tools, and where finished work goes. */
export type AgentStationId = "inbox" | "read" | "search" | "code" | "test" | "ship";

/** One tool call as the agent's speech bubble shows it, and the result it comes back with, if any. */
export type AgentToolCall = Readonly<{ call: string; result?: string }>;

/** A ticket the agent carries round, and the call it makes at each tool for it. */
export type AgentTicket = Readonly<{
  /** Short, e.g. "F-12". */
  id: string;
  /** A few words, e.g. "dark mode". */
  title: string;
  read: AgentToolCall;
  search: AgentToolCall;
  code: AgentToolCall;
  /** The passing run. */
  test: AgentToolCall;
  /** The failing run, on the loops where a test fails first. */
  failure: AgentToolCall;
  /** The edit that fixes it. */
  fix: AgentToolCall;
}>;

/** The AI feature panel: "Agent at work", a little agent walking tickets through its tools. */
export type AgentPanel = Readonly<{
  /** What the panel shows, for screen readers. */
  label: string;
  title: string;
  /** One plain line under the stage. */
  caption: string;
  /** The label under each stop. */
  stations: Readonly<Record<AgentStationId, string>>;
  /** The tickets, taken in turn. */
  tickets: readonly AgentTicket[];
  /** The word beside the shipped counter. */
  shipped: string;
  /** What the agent says when clicked. */
  greeting: string;
  /** The accessible name of the agent, a button. */
  greet: string;
  /** Announced when the agent waves. */
  greeted: string;
}>;

export type Craft = Domain &
  Readonly<{
    laptop: Laptop;
    /** The line under the "Live demo" sub-section title. */
    demoCaption: string;
    specimen: Readonly<{ title: string; subtitle: string; status: string; action: string; switchLabel: string }>;
    notes: readonly SpecNote[];
    toggle: Readonly<{ show: string; hide: string }>;
  }>;

/** The back-end domain: skills and repositories, introduced by the message-queue panel. */
export type Systems = Domain & Readonly<{ panel: QueuePanel }>;

/** The wide link card that opens the Orchestra page, the featured project, from the AI chapter. */
export type CaseStudyCard = Readonly<{
  /** The sub-section title. */
  title: string;
  /** The sub-section caption. */
  caption: string;
  /** The card's own title. */
  name: string;
  /** One sentence. */
  lede: string;
  href: string;
  /** The orange call to action; its arrow is drawn by the card. */
  cta: string;
}>;

/** The AI domain; its third part is the case study that lives on its own page. */
export type Ai = Domain & Readonly<{ panel: AgentPanel; caseStudy: CaseStudyCard }>;

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

/** One point of a case-study section: a bold lead phrase, then one sentence. */
export type CasePoint = Readonly<{
  lead: string;
  text: string;
}>;

/** What every section of the case study carries. */
type CaseSectionBase = Readonly<{
  title: string;
  /** One sentence that opens the section. */
  intro: string;
}>;

/** A short intro and a list of points. */
export type PointsSection = CaseSectionBase &
  Readonly<{
    kind: "points";
    points: readonly CasePoint[];
  }>;

/** The seven departments, each with a duty line; names and agents come from `SITE.orchestra`. */
export type DepartmentsSection = CaseSectionBase &
  Readonly<{
    kind: "departments";
    duties: Readonly<Record<DepartmentId, string>>;
  }>;

export type CaseSection = PointsSection | DepartmentsSection;

/** Everything on the `/orchestra` page that is not already in `SITE.orchestra`. */
export type OrchestraPage = Readonly<{
  metadata: Readonly<{ title: string; description: string }>;
  bar: Readonly<{ home: Link; back: Link }>;
  hero: Readonly<{
    label: string;
    heading: string;
    lede: string;
    facts: readonly string[];
    /** The public repository. */
    repo: Link;
  }>;
  demo: Readonly<{ title: string; caption: string }>;
  /** The sections after the live demo, in order. */
  sections: readonly CaseSection[];
  builtWith: Readonly<{ title: string; tools: readonly string[] }>;
  footer: Readonly<{ back: Link }>;
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
  /** The 3D diorama, parked: not on the page for now. */
  diorama: Diorama;
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
