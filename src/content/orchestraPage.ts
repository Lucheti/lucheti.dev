import type { OrchestraPage } from "./types";

/**
 * The copy of the `/orchestra` case study. Every claim comes from the
 * orchestra-plugin README; departments, agents, steps and stats are reused
 * from `SITE.orchestra` rather than typed again.
 */
export const ORCHESTRA_PAGE: OrchestraPage = {
  metadata: {
    title: "Orchestra — Lucas Garcia",
    description:
      "A case study of Orchestra, a Claude Code plugin that runs a software lifecycle with departments of agents, with the live board.",
  },
  bar: {
    home: { label: "Lucas Garcia", href: "/" },
    back: { label: "Back to the portfolio", href: "/#ai" },
  },
  hero: {
    label: "Case study",
    heading: "Orchestra",
    lede: "An autonomous software company as a Claude Code plugin. Departments of agents take a feature from idea to release, and code, not a model, decides whether each step is allowed.",
    facts: ["16 agents", "7 departments", "3 parallel workflows", "Built on Claude Code"],
  },
  demo: {
    number: "01",
    title: "Live demo",
    caption: "One feature, from idea to retro. Scroll to play it.",
  },
  sections: [
    {
      kind: "points",
      number: "02",
      title: "The idea",
      intro: "An autonomous software company that you set up once and then leave running.",
      points: [
        {
          lead: "Departments of agents.",
          text: "Product, design, engineering, QA, docs, release and learning each have a head who owns their work.",
        },
        {
          lead: "Tickets only.",
          text: "Departments coordinate through tickets in Beads and nothing else.",
        },
        {
          lead: "Two gates at genesis.",
          text: "You lock the mission and the architecture once, in a short interview.",
        },
        {
          lead: "Then it runs on its own.",
          text: "After the gates, the company plans, builds and ships, and it improves its own process.",
        },
      ],
    },
    {
      kind: "departments",
      number: "03",
      title: "Departments",
      intro: "Seven departments, each with a head and, for most, the workers it directs.",
      duties: {
        product: "Owns the roadmap and turns ideas into features.",
        design: "Flows and mockups for UI work.",
        engineering: "Breaks features into cards, builds and reviews them.",
        qa: "Tests every card and signs off releases.",
        docs: "Guides and changelog before each release.",
        release: "Unblocks stuck releases.",
        learning: "Retros and lessons.",
      },
    },
    {
      kind: "points",
      number: "04",
      title: "Code decides, not models",
      intro: "The process lives in code and data, so no prompt has to remember the rules.",
      points: [
        {
          lead: "One source of truth.",
          text: "company.yaml holds the departments, roles, lifecycles, required evidence and budgets.",
        },
        {
          lead: "One thing changes state.",
          text: "The orch command checks who may make each transition and verifies the evidence itself: tests, scope, protected paths, skipped tests, docs and the independence of reviewers.",
        },
        {
          lead: "A planner picks what runs next.",
          text: "The wake planner reads the board and decides which worker or head starts, so no model decides whether the next step happens.",
        },
        {
          lead: "Mechanical steps are code.",
          text: "Merging, releasing, deploying and rolling back are done by code, never by an agent.",
        },
      ],
    },
    {
      kind: "points",
      number: "05",
      title: "Tickets, not chat",
      intro: "Work moves between departments as tickets, which makes every hand-off visible.",
      points: [
        {
          lead: "Intake.",
          text: "Your ideas go to the head of product, who adopts or drops them against the mission.",
        },
        {
          lead: "Templates.",
          text: "Heads pour a feature, bugfix, spike or sprint, each an epic with its steps.",
        },
        {
          lead: "Documents merge like code.",
          text: "PRDs, designs and research are written on the ticket's branch and merged once accepted.",
        },
        {
          lead: "Requests between departments.",
          text: "A head asks another department for work, and the waiting ticket resumes when it is done.",
        },
        {
          lead: "Order between cards.",
          text: "A card that builds on another does not start until that work is done.",
        },
        {
          lead: "Decisions are recorded.",
          text: "Architecture and product calls go in the tracker, and every brief lists the ones in force.",
        },
      ],
    },
    {
      kind: "points",
      number: "06",
      title: "Guardrails",
      intro: "Hooks keep every agent inside its role.",
      points: [
        {
          lead: "Session start.",
          text: "Injects the agent's brief, or a head's inbox.",
        },
        {
          lead: "Before a shell command.",
          text: "Denies raw tracker writes, force pushes and deploys, and grants only the orch commands the role owns.",
        },
        {
          lead: "Before an edit.",
          text: "Keeps changes inside the ticket's scope; protected paths need the head's label.",
        },
        {
          lead: "On stop.",
          text: "A worker cannot quit while its ticket is unfinished.",
        },
        {
          lead: "After an edit.",
          text: "Runs the project's formatter.",
        },
      ],
    },
    {
      kind: "points",
      number: "07",
      title: "Releases with a safety net",
      intro: "Orch runs every release step itself. Agents cannot run deploy commands.",
      points: [
        {
          lead: "Stage and sign off.",
          text: "The epic deploys to QA, and a parallel regression sweep, one tester per criterion, signs it off.",
        },
        {
          lead: "Ship what was signed.",
          text: "Only the commit QA signed off goes to production.",
        },
        {
          lead: "Health checks and rollback.",
          text: "If production is unhealthy it rolls back automatically and a bug is filed for engineering.",
        },
        {
          lead: "Stuck releases get help.",
          text: "A merge conflict or failing runway wakes the release manager, who files the bug that unblocks it.",
        },
      ],
    },
    {
      kind: "points",
      number: "08",
      title: "Learning",
      intro: "The company reviews its own friction and changes how it works.",
      points: [
        {
          lead: "Retros after friction.",
          text: "Bounced tickets, failed runs and guard denials open a retro with the numbers; smooth epics cost nothing.",
        },
        {
          lead: "Lessons reach the right briefs.",
          text: "Each lesson is shown to every agent whose ticket matches its triggers.",
        },
        {
          lead: "Promotion to a playbook.",
          text: "A lesson seen 3 times, or in 2 projects, moves to the global playbook.",
        },
        {
          lead: "Handbook changes need approval.",
          text: "The learner proposes them and the department's head approves or declines.",
        },
      ],
    },
  ],
  builtWith: {
    title: "Built with",
    tools: ["TypeScript", "Bun", "Claude Code plugins (agents, hooks, skills, workflows, monitors)", "Beads", "launchd"],
  },
  footer: {
    back: { label: "Back to the portfolio", href: "/" },
  },
};
