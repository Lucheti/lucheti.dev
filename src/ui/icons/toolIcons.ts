import {
  siAnimedotjs,
  siAnthropic,
  siBun,
  siClarifai,
  siClaude,
  siDocker,
  siDrizzle,
  siExpress,
  siFastify,
  siFirebase,
  siGithub,
  siGraphql,
  siJest,
  siJsonwebtokens,
  siMercadopago,
  siModelcontextprotocol,
  siNatsdotio,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siNx,
  siOpenapiinitiative,
  siOpenjdk,
  siPostgresql,
  siPrisma,
  siRabbitmq,
  siRadixui,
  siReact,
  siReacthookform,
  siRedis,
  siRedux,
  siScala,
  siShadcnui,
  siSocketdotio,
  siSpring,
  siSupabase,
  siTailwindcss,
  siTanstack,
  siTestinglibrary,
  siThreedotjs,
  siTypeorm,
  siTypescript,
  siVite,
  siVitest,
  siWhatsapp,
  siXyflow,
  siZod,
  siZoom,
  type SimpleIcon,
} from "simple-icons";

/** A brand mark from Simple Icons (CC0): a single 24 × 24 path. */
export type ToolIcon = SimpleIcon;

/**
 * Tool label, exactly as the content writes it, to its official mark. A label
 * that names a product of a brand (TanStack Query, React Three Fiber) takes
 * that brand's mark. Tools without an official mark are left out on purpose:
 * they render as text, and no logo is ever invented.
 */
const TOOL_ICONS: ReadonlyMap<string, ToolIcon> = new Map<string, ToolIcon>([
  // Front end
  ["React", siReact],
  ["TypeScript", siTypescript],
  ["Next.js", siNextdotjs],
  ["Vite", siVite],
  ["Tailwind CSS", siTailwindcss],
  ["Radix UI", siRadixui],
  ["shadcn/ui", siShadcnui],
  ["TanStack Query", siTanstack],
  ["Redux Toolkit", siRedux],
  ["React Hook Form", siReacthookform],
  ["Zod", siZod],
  ["GraphQL Codegen", siGraphql],
  ["three.js", siThreedotjs],
  ["React Three Fiber", siThreedotjs],
  ["anime.js", siAnimedotjs],
  ["Vitest", siVitest],
  ["Jest", siJest],
  ["Testing Library", siTestinglibrary],
  ["React Flow", siXyflow],
  // Back end
  ["Node.js", siNodedotjs],
  ["NestJS", siNestjs],
  ["NestJS Terminus", siNestjs],
  ["Express", siExpress],
  ["Fastify", siFastify],
  ["OpenAPI", siOpenapiinitiative],
  ["JWT", siJsonwebtokens],
  ["Nx", siNx],
  ["NATS", siNatsdotio],
  ["RabbitMQ", siRabbitmq],
  ["Socket.IO", siSocketdotio],
  ["PostgreSQL", siPostgresql],
  ["Redis", siRedis],
  ["TypeORM", siTypeorm],
  ["Prisma", siPrisma],
  ["Drizzle", siDrizzle],
  ["Supabase", siSupabase],
  ["Java", siOpenjdk],
  ["Spring", siSpring],
  ["Scala", siScala],
  ["WhatsApp", siWhatsapp],
  ["WhatsApp Cloud API", siWhatsapp],
  ["Zoom Contact Center", siZoom],
  ["Firebase", siFirebase],
  ["Mercado Pago", siMercadopago],
  ["Docker", siDocker],
  // AI and tooling
  ["Claude Code", siClaude],
  ["Claude Code plugins", siClaude],
  ["Anthropic SDK", siAnthropic],
  ["Model Context Protocol SDK", siModelcontextprotocol],
  ["Clarifai platform", siClarifai],
  ["Bun", siBun],
  ["GitHub", siGithub],
]);

/** The mark for a tool label, or undefined when the tool renders as text only. */
export function toolIcon(label: string): ToolIcon | undefined {
  return TOOL_ICONS.get(label);
}

/** The GitHub mark, for links to repositories. */
export const GITHUB_ICON: ToolIcon = siGithub;
