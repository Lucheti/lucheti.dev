import { ArtifactStage } from "@/artifact";
import { SITE } from "@/content";
import { Sections } from "@/sections";
import { StoryProvider } from "@/story";

/**
 * Composition root. Two layers share one scroll story: the chapters, and the
 * 3D artifact floating above them (it never takes pointer events).
 */
export default function Home() {
  return (
    <StoryProvider>
      <Sections content={SITE} />
      <ArtifactStage />
    </StoryProvider>
  );
}
