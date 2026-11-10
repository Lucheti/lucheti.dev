import type { BackdropManifest, SiteContent } from "./types";

/**
 * Every word on the site. Career facts come from Lucas's LinkedIn profile;
 * the lab entries are drafts and need his confirmation before publishing.
 */
export const SITE: SiteContent = {
  name: "Lucas Garcia",
  role: "Product Engineer",
  nav: [
    { label: "Method", chapter: "method" },
    { label: "Work", chapter: "work" },
    { label: "AI workflows", chapter: "lab" },
    { label: "Contact", chapter: "contact" },
  ],
  hero: {
    eyebrow: "Lucas Garcia · Product Engineer · Buenos Aires",
    headline: ["From idea", "to shipped."],
    lede: "I'm a product engineer with seven years at Front, Clarifai and MuleSoft. I learned to build before AI. Now I design the agent workflows that carry the repetitive half of the job, so my time goes into the product.",
    primary: { label: "See the work", href: "#work" },
    secondary: { label: "Get in touch", href: "#contact" },
    facts: [
      { label: "Now", value: "Senior Software Engineer at Front" },
      { label: "Before", value: "Clarifai · MuleSoft, a Salesforce company" },
      { label: "Based", value: "Buenos Aires, working remotely" },
    ],
  },
  method: {
    label: "Method",
    heading: "One loop, owned end to end.",
    intro: "Product engineering is the whole loop, not one stage of it. Each step below comes with where I did it.",
    steps: [
      {
        number: "01",
        title: "Discover",
        claim: "Start from the problem, not the ticket.",
        proof: "I sit down with product and design to work through the edge cases before the build starts.",
        source: "Front",
      },
      {
        number: "02",
        title: "Design",
        claim: "Make the complicated thing feel obvious.",
        proof: "I led the frontend team that turned computer-vision capabilities into interfaces people could pick up and use.",
        source: "Clarifai",
      },
      {
        number: "03",
        title: "Build",
        claim: "Full stack, typed and accessible.",
        proof: "I shipped on both sides of Anypoint Platform: React and Node in front, Scala and Java behind, with accessibility built into my team's components.",
        source: "MuleSoft",
      },
      {
        number: "04",
        title: "Ship",
        claim: "Let agents carry the repetitive half.",
        proof: "I use AI agents for prototyping and code review at work, and I built Orchestra to run a whole delivery loop with them.",
        source: "Front · Orchestra",
      },
    ],
  },
  work: {
    label: "Selected work",
    heading: "Seven years of shipped product.",
    intro: "Three companies, one thread: taking something technically hard and making it usable.",
    cases: [
      {
        company: "Front",
        role: "Senior Software Engineer",
        period: "2025 — Now",
        headline: "New channels for customer operations",
        summary: "Front is where teams run their customer conversations. I lead the work that brings new channels into the platform.",
        highlights: [
          "Spearheaded the WhatsApp and Zoom Contact Center integrations.",
          "Worked the edge cases through with product and design.",
          "Put AI agents into my prototyping and code review loop.",
        ],
        tags: ["Integrations", "Messaging", "AI-assisted delivery"],
      },
      {
        company: "Clarifai",
        role: "Senior Software Engineer · Frontend lead",
        period: "2023 — 2025",
        headline: "Making computer vision usable",
        summary: "Clarifai builds AI and computer-vision tooling. I led the engineers who made it approachable.",
        highlights: [
          "Led a team of frontend engineers.",
          "Architected the front-end frameworks and libraries that improved performance and development speed.",
          "Built the animations and transitions that made the product feel finished.",
        ],
        tags: ["React", "TypeScript", "Team lead", "Motion"],
      },
      {
        company: "MuleSoft",
        role: "Intern → AMTS → MTS",
        period: "2019 — 2023",
        headline: "Anypoint Platform, front to back",
        summary: "Three and a half years at MuleSoft, a Salesforce company, growing from intern to Member of Technical Staff.",
        highlights: [
          "Worked full stack on Anypoint Platform: React and Node, Scala, Java and Spring.",
          "Implemented accessibility across most of my team's components.",
          "Started in testing strategy, which still shapes how I ship.",
        ],
        tags: ["React", "Node.js", "Scala", "Java", "Accessibility"],
      },
    ],
  },
  lab: {
    label: "AI workflows",
    heading: "Agents that do real work.",
    intro: "Side projects where I push on how far an automated workflow can go before it needs a person.",
    projects: [
      {
        name: "Orchestra",
        tagline: "A software company staffed by agents.",
        description: "A Claude Code plugin that organises agents into departments: product, design, engineering, QA and release. An idea goes in. It comes out as a PRD, scoped cards, reviewed code and a release that has passed QA sign-off.",
        highlights: [
          "Department heads plan; specialist agents build.",
          "An adversarial review panel for high-risk changes.",
          "Releases with health checks and automatic rollback.",
        ],
        featured: true,
      },
      {
        name: "Botardo",
        tagline: "Chatbots for the channels customers already use.",
        description: "A chatbot platform built on Meta's messaging APIs, rebuilt from a locked scope and domain model.",
        highlights: [],
        featured: false,
      },
      {
        name: "Saga Control Room",
        tagline: "Watch a distributed transaction succeed, fail and undo itself.",
        description: "A live demo of the saga pattern on a microservices base, including the compensation failures most demos skip.",
        highlights: [],
        featured: false,
      },
    ],
  },
  contact: {
    label: "Contact",
    heading: "Let's build something that ships.",
    body: "I'm most useful where product and engineering overlap. If that's the role, I'd like to hear about it.",
    links: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/luqui/" }],
    footnote: "© 2026 Lucas Garcia. Built with Next.js, three.js and Motion.",
  },
};

/** Frames of the scroll-scrubbed backdrop video, extracted to public/backdrop. */
export const BACKDROP: BackdropManifest = {
  frameCount: 145,
  aspectRatio: 16 / 9,
  sets: [{ width: 854, directory: "/backdrop/854" }],
};
