import { SITE } from "@/content";
import { Sections } from "@/sections";
import { HashLanding, StoryProvider } from "@/story";

/** Composition root: the chapters share one scroll story. */
export default function Home() {
  return (
    <StoryProvider>
      <HashLanding />
      <Sections content={SITE} />
    </StoryProvider>
  );
}
