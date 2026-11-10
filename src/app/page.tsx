import { ArtifactStage } from "@/artifact";
import { Backdrop } from "@/backdrop";
import { BACKDROP, SITE } from "@/content";
import { Sections } from "@/sections";
import { SmoothScroll, StoryProvider } from "@/story";

/**
 * Composition root. Three layers share one scroll story:
 * the scrubbed video backdrop, the 3D artifact, and the content on top.
 */
export default function Home() {
  return (
    <StoryProvider>
      <SmoothScroll />
      <Backdrop manifest={BACKDROP} />
      <ArtifactStage />
      <Sections content={SITE} />
    </StoryProvider>
  );
}
