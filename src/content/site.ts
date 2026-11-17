import type { FrameSequence, SiteContent } from "./types";

/**
 * Every word on the site. Career facts come from Lucas's LinkedIn profile;
 * Orchestra and the systems section come from his own repositories
 * (orchestra-plugin, transactional-microservices). Industry trends are framed
 * as context, one line each, and kept to well-known milestones.
 */
export const SITE: SiteContent = {
  name: "Lucas Garcia",
  role: "Product Engineer",
  description:
    "Lucas Garcia, product engineer in Buenos Aires. Seven years of React and distributed systems at Salesforce, Clarifai and Front, now building with AI agents.",
  timeZone: "America/Argentina/Buenos_Aires",
  city: "Buenos Aires",
  nav: [
    { label: "Build log", chapter: "timeline" },
    { label: "Front end", chapter: "craft" },
    { label: "Back end", chapter: "systems" },
    { label: "AI", chapter: "ai" },
    { label: "Contact", chapter: "contact" },
  ],
  hero: {
    name: ["Lucas", "Garcia"],
    role: "Product Engineer",
    summary: "Seven years shipping React front ends and distributed back ends at Salesforce, Clarifai and Front.",
    portrait: {
      src: "/portrait/lucas.webp",
      alt: "Portrait of Lucas Garcia",
      width: 1280,
      height: 1589,
    },
    facts: [
      { label: "Now", value: "Senior SWE · Front" },
      { label: "Focus", value: "Front end · Back end · AI agents" },
      { label: "Based", value: "Buenos Aires · GMT−3" },
    ],
    primary: { label: "Read the build log", href: "#timeline" },
    secondary: { label: "Get in touch", href: "#contact" },
  },
  timeline: {
    label: "Build log",
    heading: "Seven years. One before and after.",
    intro: "I learned the craft before AI. Then the ground moved.",
    lanes: { world: "The industry", me: "Me" },
    eras: { "pre-ai": "Pre-AI", ai: "AI-native" },
    stops: [
      {
        year: "2019",
        period: "Oct 2019",
        company: "MuleSoft · Salesforce",
        role: "Engineering intern",
        did: "Wrote the test strategy for Anypoint Platform components.",
        trend: "React Hooks ship. Components go functional.",
        era: "pre-ai",
      },
      {
        year: "2020",
        period: "Oct 2020",
        company: "MuleSoft · Salesforce",
        role: "Associate MTS",
        did: "React interfaces on top of Java and Scala services.",
        trend: "Everyone goes remote. TypeScript becomes the default.",
        era: "pre-ai",
      },
      {
        year: "2021",
        period: "Aug 2021",
        company: "MuleSoft · Salesforce",
        role: "Member of Technical Staff",
        did: "Full stack on Anypoint, with accessibility across my team's components.",
        trend: "API-led connectivity and microservices everywhere.",
        era: "pre-ai",
      },
      {
        year: "2023",
        period: "Feb 2023",
        company: "Clarifai",
        role: "Senior SWE · Frontend lead",
        did: "Led the team that made computer vision usable.",
        trend: "GPT-4 lands. Every product wants an AI feature.",
        era: "ai",
      },
      {
        year: "2024",
        period: "2024",
        company: "Clarifai",
        role: "Senior SWE · Frontend lead",
        did: "Built the front-end frameworks the AI platform ran on.",
        trend: "RAG, tool use and the first agents.",
        era: "ai",
      },
      {
        year: "2025",
        period: "Dec 2025",
        company: "Front",
        role: "Senior Software Engineer",
        did: "Shipped WhatsApp and Zoom Contact Center channels, with agents in my build and review loop.",
        trend: "Agentic coding goes mainstream.",
        era: "ai",
      },
    ],
    milestoneKinds: { promotion: "Promotion", move: "New company" },
    milestones: [
      { date: "Oct 2020", kind: "promotion", label: "Intern → AMTS", note: "First engineering role, a year after joining as an intern.", afterStop: 0 },
      { date: "Aug 2021", kind: "promotion", label: "AMTS → MTS", note: "Second promotion in under two years.", afterStop: 1 },
      { date: "Feb 2023", kind: "move", label: "Salesforce → Clarifai", note: "Joined an AI platform as a senior engineer and front-end lead.", afterStop: 2 },
      { date: "Dec 2025", kind: "move", label: "Clarifai → Front", note: "Senior engineer on Front's customer operations platform.", afterStop: 4 },
    ],
  },
  capabilities: {
    heading: "Capabilities",
    intro: "What I work with, by domain, and the libraries I use in each.",
    repoLabels: {
      open: "View on GitHub",
      pending: "Coming soon",
    },
    subsections: {
      skills: { title: "Skills", caption: "The areas I work in, and the libraries I use in each." },
      repos: { title: "Repositories", caption: "Code you can open and read." },
      demo: { title: "Live demo", caption: "" },
    },
  },
  craft: {
    heading: "Front end",
    intro: "React and TypeScript since 2019, from Salesforce's Anypoint Platform to Clarifai and Front.",
    panel: {
      label:
        "An isometric, exploded view of one card of UI. Its five layers, tokens, layout, components, content and interaction, slowly separate and come back together.",
      title: "Layers",
      layers: {
        tokens: "Tokens",
        layout: "Layout",
        components: "Components",
        content: "Content",
        interaction: "Interaction",
      },
    },
    areas: [
      {
        name: "UI engineering",
        summary: "Component libraries and design systems in React and TypeScript.",
        tools: ["React", "TypeScript", "Next.js", "Vite", "Tailwind CSS", "Radix UI", "shadcn/ui"],
      },
      {
        name: "State & data",
        summary: "Server state, forms and typed API clients.",
        tools: ["TanStack Query", "Redux Toolkit", "Zustand", "React Hook Form", "Zod", "GraphQL Codegen"],
      },
      {
        name: "Accessibility",
        summary: "Keyboard and screen-reader support across a component library.",
        tools: ["WCAG 2.2 AA", "WAI-ARIA", "Radix UI", "Testing Library"],
      },
      {
        name: "Motion & 3D",
        summary: "Animations, transitions and WebGL scenes, like this site.",
        tools: ["Motion", "three.js", "React Three Fiber", "Lenis", "anime.js"],
      },
      {
        name: "Testing",
        summary: "Unit and component tests, and the test strategy behind them.",
        tools: ["Vitest", "Jest", "Testing Library"],
      },
    ],
    repos: [
      {
        name: "reel-graph",
        description:
          "A node-based video editor that runs in the browser. Wire clips, trims, effects and exports as a graph; decoding and encoding happen on the client.",
        tools: ["React", "TypeScript", "React Flow", "MediaBunny", "WebCodecs", "Web Workers"],
        status: { kind: "public", href: "https://github.com/Lucheti/reel-graph" },
        illustration: "node-graph",
      },
      {
        name: "lucheti.dev",
        description: "This site. A scroll-driven story with a WebGL object, frame-scrubbed video and live demos.",
        tools: ["Next.js", "React Three Fiber", "Motion", "Tailwind CSS", "Vitest"],
        status: { kind: "public", href: "https://github.com/Lucheti/lucheti.dev" },
        illustration: "website",
      },
    ],
    demoCaption: "A component and its spec. Turn the spec on to see the measurements, states and semantics behind it.",
    specimen: {
      title: "WhatsApp",
      subtitle: "Channel connected · 3 inboxes",
      status: "Live",
      action: "Manage",
      switchLabel: "Receive messages",
    },
    notes: [
      { id: "padding", label: "Padding", value: "24 px" },
      { id: "radius", label: "Radius", value: "16 px" },
      { id: "type", label: "Type", value: "15 / 24 Geist" },
      { id: "contrast", label: "Contrast", value: "WCAG AA" },
      { id: "focus", label: "Focus", value: "2 px ring · 3 px offset" },
      { id: "motion", label: "Motion", value: "320 ms · ease-out-expo" },
      { id: "role", label: "Semantics", value: "role=switch · aria-checked" },
    ],
    toggle: { show: "Show spec", hide: "Hide spec" },
  },
  systems: {
    heading: "Back end",
    intro: "Node.js services, messaging and data, plus Java and Scala on Salesforce's Anypoint Platform.",
    panel: {
      label:
        "A toy message queue. Checkout publishes a steady flow of messages to a NATS queue, which deals each one to the least busy of three services: Orders, Payments and Inventory. Send more to flood it: an overloaded service goes down, hands its messages back to the queue, restarts and drains the backlog. No message is ever lost.",
      title: "Message queue",
      producer: { name: "Checkout", role: "Producer" },
      broker: { name: "NATS", tool: "NATS", detail: "Queue" },
      services: [
        { name: "Orders", tool: "NestJS" },
        { name: "Payments", tool: "NestJS" },
        { name: "Inventory", tool: "NestJS" },
      ],
      send: { label: "Send 10 messages", count: 10 },
      statuses: { healthy: "Healthy", busy: "Busy", down: "Down", restarting: "Restarting" },
      readout: { queued: "Queued", processed: "Processed", restarts: "Restarts", inFlight: "in flight", done: "done" },
      announcements: {
        down: "{service} went down. Its {count} messages went back to the queue.",
        restarting: "{service} is restarting.",
        recovered: "{service} is back and draining the queue.",
        settled: "The backlog is cleared.",
      },
    },
    areas: [
      {
        name: "Services & APIs",
        summary: "REST APIs and microservices behind one gateway.",
        tools: ["Node.js", "NestJS", "Express", "Fastify", "OpenAPI", "JWT", "Nx"],
      },
      {
        name: "Messaging & real time",
        summary: "Event-driven services and live connections.",
        tools: ["NATS", "RabbitMQ", "Socket.IO", "WebSockets"],
      },
      {
        name: "Data & caching",
        summary: "Relational models, migrations and caches.",
        tools: ["PostgreSQL", "Redis", "TypeORM", "Prisma", "Drizzle", "Supabase"],
      },
      {
        name: "Reliability",
        summary: "Sagas, circuit breakers, health checks and structured logs.",
        tools: ["Saga orchestration", "opossum", "NestJS Terminus", "Winston"],
      },
      {
        name: "JVM",
        summary: "Java and Scala services on Anypoint Platform.",
        tools: ["Java", "Spring", "Scala"],
      },
      {
        name: "Integrations",
        summary: "Messaging channels and third-party APIs.",
        tools: ["WhatsApp", "Zoom Contact Center", "Firebase", "Mercado Pago"],
      },
    ],
    repos: [
      {
        name: "transactional-microservices",
        description:
          "An order flow across NestJS microservices over NATS. A saga orchestrator compensates in reverse when a step fails, and reads are cache-aside.",
        tools: ["NestJS", "NATS", "PostgreSQL", "Redis", "TypeORM", "Nx"],
        status: { kind: "public", href: "https://github.com/Lucheti/transactional-microservices" },
        illustration: "saga",
      },
      {
        name: "render-queue",
        description:
          "An API for media uploads and render jobs: presigned S3 uploads, a job queue with workers, and progress over server-sent events. Ships as containers for ECS Fargate.",
        tools: ["Node.js", "Fastify", "BullMQ", "PostgreSQL", "Drizzle", "Docker", "AWS ECS Fargate"],
        status: { kind: "public", href: "https://github.com/Lucheti/render-queue" },
        illustration: "job-queue",
      },
    ],
  },
  ai: {
    heading: "AI",
    intro: "Agent workflows for writing and reviewing code, and the AI products I've worked on.",
    panel: {
      label:
        "A toy image generator: pick a subject, a mood and a framing, press Generate, and watch a little picture resolve out of noise.",
      title: "Tiny diffusion",
      caption: "A toy, not a real model: it draws with shapes and a seeded random number, no neural network.",
      groups: {
        subject: {
          label: "Subject",
          options: [
            { id: "lighthouse", label: "lighthouse", phrase: "lighthouse" },
            { id: "vase", label: "ceramic vase", phrase: "ceramic vase" },
            { id: "mountain", label: "mountain", phrase: "mountain" },
            { id: "city", label: "city", phrase: "city" },
          ],
        },
        mood: {
          label: "Mood",
          options: [
            { id: "dusk", label: "dusk", phrase: "at dusk" },
            { id: "night", label: "night", phrase: "at night" },
            { id: "morning", label: "morning", phrase: "in the morning" },
            { id: "storm", label: "storm", phrase: "in a storm" },
          ],
        },
        framing: {
          label: "Framing",
          options: [
            { id: "wide", label: "wide", phrase: "wide" },
            { id: "close-up", label: "close-up", phrase: "close-up" },
          ],
        },
      },
      generate: "Generate",
      generating: "Denoising",
      done: "Done",
      seed: "Seed",
      reroll: "New seed",
      gallery: "Recent pictures",
    },
    areas: [
      {
        name: "Agentic coding",
        summary: "Multi-agent workflows that plan, build, review and ship code.",
        tools: ["Claude Code", "plugins & hooks", "sub-agents", "Agent Teams"],
      },
      {
        name: "Tool use & MCP",
        summary: "MCP servers and clients that give models real tools.",
        tools: ["Model Context Protocol SDK", "Anthropic SDK", "Zod"],
      },
      {
        name: "AI products",
        summary: "Interfaces that make computer-vision models usable.",
        tools: ["Clarifai platform", "model inference APIs"],
      },
      {
        name: "Chatbots",
        summary: "WhatsApp assistants.",
        tools: ["BuilderBot", "Baileys", "WhatsApp Cloud API", "Supabase"],
      },
      {
        name: "Generative media",
        summary: "Image and video generation; this site's portrait and background film.",
        tools: ["Higgsfield", "Nano Banana Pro"],
      },
    ],
    repos: [
      {
        name: "orchestra",
        description:
          "A Claude Code plugin that runs a software lifecycle: independent departments of agents take one feature from idea to release.",
        tools: ["Claude Code", "plugins & hooks", "sub-agents", "TypeScript", "Bun"],
        status: { kind: "public", href: "https://github.com/Lucheti/orchestra" },
        illustration: "departments",
      },
      {
        name: "shot-planner",
        description:
          "A chat agent that turns a creative brief into a storyboard, then generates each shot through image and video APIs with tool calls.",
        tools: ["Anthropic SDK", "Runway API", "tool use", "streaming", "React", "Node.js"],
        status: { kind: "public", href: "https://github.com/Lucheti/shot-planner" },
        illustration: "storyboard",
      },
    ],
    caseStudy: {
      title: "Featured project",
      caption: "Orchestra in depth: how it works, and the board running live.",
      name: "Orchestra",
      lede: "A Claude Code plugin that runs a software company: seven departments of agents take a feature from idea to release, and code checks every step.",
      href: "/orchestra",
      cta: "See how it works",
    },
  },
  orchestra: {
    label: "Live demo",
    heading: "Orchestra",
    intro: "Orchestra is a Claude Code plugin. Independent departments pass tickets to each other, from idea to release.",
    principles: [
      "The process lives in code, not prompts.",
      "Every transition is checked against evidence.",
      "Merges, releases and rollbacks are done by code, never by an agent.",
    ],
    stats: [
      { value: "7", label: "Departments" },
      { value: "16", label: "Agents" },
      { value: "3", label: "Parallel workflows" },
    ],
    departments: [
      { id: "product", name: "Product", agents: ["head-of-product", "product-manager", "researcher"] },
      { id: "design", name: "Design", agents: ["head-of-design", "designer"] },
      {
        id: "engineering",
        name: "Engineering",
        agents: [
          "head-of-engineering",
          "engineer",
          "reviewer",
          "review-correctness",
          "review-security",
          "review-architecture",
        ],
      },
      { id: "qa", name: "QA", agents: ["head-of-qa", "qa-tester"] },
      { id: "docs", name: "Docs", agents: ["tech-writer"] },
      { id: "release", name: "Release", agents: ["release-manager"] },
      { id: "learning", name: "Learning", agents: ["learner"] },
    ],
    steps: [
      { department: "product", workers: ["head-of-product"], ticket: "F-12", message: "idea accepted → feature F-12" },
      { department: "product", workers: ["researcher", "product-manager"], ticket: "F-12", message: "research + PRD" },
      { department: "engineering", workers: ["head-of-engineering"], ticket: "F-12", message: "split into 3 cards" },
      { department: "design", workers: ["head-of-design", "designer"], ticket: "D-07", message: "mockups for C-33" },
      { department: "engineering", workers: ["engineer", "engineer", "engineer"], ticket: "C-31…33", message: "3 cards in parallel" },
      {
        department: "engineering",
        workers: ["reviewer", "review-correctness", "review-security", "review-architecture"],
        ticket: "C-31…33",
        message: "review panel · 0 blocking",
      },
      { department: "qa", workers: ["head-of-qa", "qa-tester"], ticket: "F-12", message: "6 / 6 criteria pass" },
      { department: "docs", workers: ["tech-writer"], ticket: "F-12", message: "changelog updated" },
      { department: "release", workers: [], ticket: "F-12", message: "deployed by code · health checks green" },
      { department: "learning", workers: ["learner"], ticket: "F-12", message: "retro · 2 lessons recorded" },
    ],
  },
  contact: {
    label: "Contact",
    heading: "Let's build something that ships.",
    body: "I'm most useful where product, front end and back end meet.",
    email: "lucasgustavogarciaort@gmail.com",
    links: [
      { label: "Email me", href: "mailto:lucasgustavogarciaort@gmail.com" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/luqui/" },
    ],
    signoff: "Hecho en Buenos Aires",
    footnote: "© 2026 Lucas Garcia",
  },
};

/** The orange network video behind the Agents chapter, as still frames. */
export const ORCHESTRA_SEQUENCE: FrameSequence = {
  frameCount: 145,
  aspectRatio: 16 / 9,
  sets: [{ width: 854, directory: "/sequence/orchestra/854" }],
};
