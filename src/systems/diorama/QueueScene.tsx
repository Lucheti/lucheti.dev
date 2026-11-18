"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { QueueDioramaParts } from "./composeQueueDiorama";
import { IslandCanvas, type DioramaBehaviour } from "./kit";
import { stageQueue } from "./stageQueue";

type SceneProps = Readonly<{
  parts: QueueDioramaParts;
  behaviour: DioramaBehaviour;
  /** The island is on screen: render every frame; otherwise only on demand. */
  running: boolean;
  /** The first frame has been drawn; the scene can replace the 2D board. */
  onReady: () => void;
  /** The WebGL context was lost; the 2D board should come back. */
  onLost: () => void;
  /** The pointer moved onto the button, or off it. */
  onHover: (over: boolean) => void;
}>;

/**
 * The queue diorama's WebGL canvas: the stage is built once in the browser and freed when the canvas goes;
 * the island's canvas draws it, and a click on the big button sends the batch.
 */
export default function QueueScene({ parts, behaviour, running, onReady, onLost, onHover }: SceneProps): ReactNode {
  const [stage] = useState(() => stageQueue(parts));
  useEffect(() => () => stage.dispose(), [stage]);
  return (
    <IslandCanvas
      island={stage.model.island()}
      director={stage.director}
      waker={parts.waker}
      gesture={parts.gesture}
      behaviour={behaviour}
      running={running}
      onPress={() => parts.button.press()}
      onReady={onReady}
      onLost={onLost}
      onHover={onHover}
    />
  );
}
