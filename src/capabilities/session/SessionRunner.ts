import type { SessionPromptId } from "@/content";
import type { FrameListener } from "@/laptop";
import type { AgentSession } from "./AgentSession";
import type { RunDriver, SessionCue, SessionView } from "./stream";

type Listener = () => void;
type Hearer = (cues: readonly SessionCue[]) => void;

/** What the visitor and the ghost can do in the session. */
export interface SessionActions {
  /** Starts a run of `prompt`, streaming in. */
  start(prompt: SessionPromptId, driver: RunDriver): void;
}

/**
 * Runs the session on the screen's frames and is the panel's store: React reads `snapshot()` through
 * `useSyncExternalStore` and re-renders only when it changes, and the live region hears the cues. The
 * visitor's and the ghost's chips come through here too, so a run shows at once, even with no frames.
 */
export class SessionRunner implements FrameListener, SessionActions {
  private readonly listeners = new Set<Listener>();
  private readonly hearers = new Set<Hearer>();
  private shown: SessionView;

  public constructor(private readonly session: AgentSession) {
    this.shown = session.view();
  }

  /** The session as last published. */
  public readonly snapshot = (): SessionView => this.shown;

  /** Calls `listener` whenever `snapshot()` changes; returns the unsubscribe. */
  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Calls `hearer` with each batch of cues; returns the unsubscribe. */
  public listen(hearer: Hearer): () => void {
    this.hearers.add(hearer);
    return () => this.hearers.delete(hearer);
  }

  public start(prompt: SessionPromptId, driver: RunDriver): void {
    this.session.start(prompt, driver);
    this.flush();
  }

  /** Shows the visitor a finished run of `prompt` at once, for reduced motion. */
  public show(prompt: SessionPromptId): void {
    this.session.show(prompt, "visitor");
    this.flush();
  }

  public frame(_now: number, stepMs: number): void {
    this.session.advance(stepMs);
    this.flush();
  }

  /** Off screen the run simply waits; it picks up where it was. */
  public halt(): void {}

  private flush(): void {
    const next = this.session.view();
    if (next !== this.shown) {
      this.shown = next;
      this.listeners.forEach((listener) => listener());
    }
    const cues = this.session.takeCues();
    if (cues.length > 0) {
      this.hearers.forEach((hearer) => hearer(cues));
    }
  }
}
