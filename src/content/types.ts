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

/** One row of a domain's skill card. */
export type SkillArea = Readonly<{
  /** Short: "Frameworks", "Motion & 3D". */
  name: string;
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
  /** A note at the foot of the card pointing to more about it on this site, e.g. its own page. */
  feature?: RepoFeature;
}>;

/** A card's note with a button to a page on this site. */
export type RepoFeature = Readonly<{
  /** One or two sentences. */
  note: string;
  href: string;
  /** The button's label; its arrow is drawn by the button. */
  cta: string;
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
  subsections: Readonly<{ repos: Subsection; skills: Readonly<{ title: string }> }>;
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
  /** The app's name, which names its navigation for screen readers. */
  app: string;
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
  send: Readonly<{
    label: string;
    /** The short call floating over the diorama's big button. */
    short: string;
    count: number;
  }>;
  /** How each service status is written. */
  statuses: Readonly<{ healthy: string; busy: string; down: string; restarting: string }>;
  /** The footer's counters, and the words for a service's messages in flight and done. */
  readout: Readonly<{ queued: string; processed: string; restarts: string; inFlight: string; done: string }>;
  /** Live-region sentences; `{service}` and `{count}` are filled in. */
  announcements: Readonly<{ down: string; restarting: string; recovered: string; settled: string }>;
}>;

/** A service behind the gateway on the Back end's service map. */
export type MapServiceId = "orders" | "payments" | "inventory";

/** A data store or queue the services use. */
export type MapStoreId = "postgres" | "nats" | "redis";

/** A box on the service map: its name, and the tool whose brand mark it wears, if it has one. */
export type MapNodeCopy = Readonly<{ name: string; tool?: string }>;

/**
 * The Back end panel: the top-right corner of the same laptop, with an ops app open on a live service map.
 * Copy only; the panel decides how it looks. In the templates, `{service}` is a service's name and `{n}` a
 * number.
 */
export type ServiceMapCopy = Readonly<{
  /** What the panel shows, for screen readers. */
  label: string;
  /** The app's name. */
  app: string;
  /** The environment in the sidebar's switcher and at the start of the breadcrumb. */
  environment: string;
  /** The sidebar's pages; the selected one is the map. Their counts show at the crop's edge. */
  pages: readonly Readonly<{ name: string; selected: boolean; count: "incidents" | null }>[];
  /** The sidebar's search field. */
  search: string;
  /** The page's title, ending the breadcrumb. */
  title: string;
  /** The toolbar's time range. */
  range: string;
  /** The indicator: the map is live, or paused while the panel is off screen or motion is reduced. */
  live: Readonly<{ on: string; off: string }>;
  /** The spike button, and its words while a spike runs. */
  spike: Readonly<{ label: string; running: string }>;
  clients: MapNodeCopy;
  gateway: MapNodeCopy;
  services: Readonly<Record<MapServiceId, MapNodeCopy>>;
  stores: Readonly<Record<MapStoreId, MapNodeCopy>>;
  /** The tiny metric on each card. */
  metrics: Readonly<{ rate: string; ops: string; p95: string; queued: string; failedFast: string }>;
  /** A service's health, and the action its card takes. */
  health: Readonly<{ up: string; down: string; recovering: string }>;
  takeDown: string;
  /** The gateway's circuit breaker on an edge, when it is not closed. */
  breaker: Readonly<{ open: string; halfOpen: string }>;
  /** The legend under the map. */
  legend: Readonly<{ request: string; probe: string; open: string }>;
  /** Live-region sentences. */
  announcements: Readonly<{
    down: string;
    opened: string;
    probing: string;
    back: string;
    spike: string;
    settled: string;
  }>;
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

/** A department on the Orchestra office's floor, in the order a ticket passes them. */
export type OfficeDepartmentId = "product" | "design" | "engineering" | "qa" | "release";

/**
 * The AI chapter's 3D island: the Orchestra office, where a ticket goes from Product through Design,
 * Engineering and QA to Release. Its tickets are the ones in `AgentPanel`.
 */
export type OfficePanel = Readonly<{
  /** What the island shows, for screen readers. */
  label: string;
  /** The title in the strip under the island. */
  title: string;
  /** The big button: its accessible name, and the short call floating over it. */
  drop: Readonly<{ label: string; short: string }>;
  /** The sign over each department's corner. */
  departments: Readonly<Record<OfficeDepartmentId, string>>;
  /** The strip's words: the shipped counter, the ideas waiting, and the line shown when no ticket is moving. */
  readout: Readonly<{ shipped: string; waiting: string; idle: string }>;
  /** Live-region sentences; `{ticket}` is filled in with the ticket's id and title. */
  announcements: Readonly<{ dropped: string; full: string; bounced: string; shipped: string }>;
}>;

/** A prompt the agent session window offers as a chip. */
export type SessionPromptId = "dark-mode" | "slow-page" | "tests";

/** One line of a small diff: added or removed, and its code. */
export type DiffLineCopy = Readonly<{ sign: "add" | "remove"; code: string }>;

/** An edit the agent makes: the file, and the few lines of it that change. */
export type SessionEditCopy = Readonly<{ path: string; diff: readonly DiffLineCopy[] }>;

/** One run of the agent: what it is asked, what it plans, the calls it makes and the pull request it opens. */
export type SessionPromptCopy = Readonly<{
  /** The chip's words. */
  chip: string;
  /** The visitor's message, as the chip sends it. */
  request: string;
  /** The agent's short plan, one line per step. */
  plan: readonly string[];
  read: Readonly<{ path: string; result: string }>;
  search: Readonly<{ query: string; result: string }>;
  edit: SessionEditCopy;
  /** The passing test run's result, e.g. "24 passed". */
  passed: string;
  /** On the runs where a test fails first: the result, the agent's note, and the edit that fixes it. */
  failure: Readonly<{ result: string; note: string; fix: SessionEditCopy }>;
  /** The reviewer's comment, and the edit that answers it. */
  review: Readonly<{ comment: string; fix: SessionEditCopy }>;
  /** The pull request: its number, title and size. */
  pr: Readonly<{ number: number; title: string; added: number; removed: number }>;
}>;

/**
 * The AI panel: a frameless "Agent" app window, its top-right corner in view, showing a coding session. A
 * prompt chip starts a run that streams in: the request, a plan, tool calls, tests, a review and a pull
 * request. Copy only; the panel decides how it looks. In the templates, `{prompt}` is a chip's words.
 */
export type SessionCopy = Readonly<{
  /** What the panel shows, for screen readers. */
  label: string;
  /** The app's name. */
  app: string;
  /** The repository, at the start of the breadcrumb. */
  repo: string;
  /** The breadcrumb's end before any run. */
  untitled: string;
  /** Past sessions in the sidebar, which the crop hides; decorative. */
  history: readonly string[];
  /** The model pill. */
  model: string;
  /** The status beside it. */
  status: Readonly<{ running: string; done: string; idle: string }>;
  /** The chips' group, for screen readers. */
  prompts: string;
  /** The chips, in order; the first run is open when the page loads. */
  order: readonly SessionPromptId[];
  runs: Readonly<Record<SessionPromptId, SessionPromptCopy>>;
  /** Who writes the review comment, and the word when it is answered. */
  reviewer: string;
  resolved: string;
  /** The ending card's heading. */
  opened: string;
  /** A tool call's word while it runs. */
  working: string;
  /** Live-region sentences. */
  announcements: Readonly<{ started: string; failed: string; passed: string; resolved: string; opened: string }>;
}>;

export type Craft = Domain &
  Readonly<{
    laptop: Laptop;
  }>;

/**
 * The back-end domain: skills and repositories, introduced by the service map in a laptop's top-right
 * corner. The message-queue panel's copy stays for its parked diorama.
 */
export type Systems = Domain & Readonly<{ map: ServiceMapCopy; panel: QueuePanel }>;

/**
 * The AI domain: skills and repositories, introduced by the agent session window. The Orchestra office
 * island and its 2D agent panel are parked; their copy stays. Orchestra's card points to its own page.
 */
export type Ai = Domain & Readonly<{ session: SessionCopy; panel: AgentPanel; office: OfficePanel }>;

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
