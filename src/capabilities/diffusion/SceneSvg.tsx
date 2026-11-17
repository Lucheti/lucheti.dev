import { memo, useId, type ReactNode } from "react";
import { assertNever, PICTURE_HEIGHT, PICTURE_WIDTH, type Paint, type Scene, type Shape } from "./SceneShapes";

type SceneSvgProps = Readonly<{ scene: Scene }>;

/** The SVG fill for a paint: the colour itself, or a reference to the shape's gradient. */
function fillOf(paint: Paint, gradientId: string): string {
  switch (paint.kind) {
    case "solid":
      return paint.color;
    case "linear":
      return `url(#${gradientId})`;
    default:
      return assertNever(paint);
  }
}

type DrawnShape = Readonly<{ shape: Shape; gradientId: string }>;

function ShapeMark({ shape, gradientId }: DrawnShape): ReactNode {
  switch (shape.kind) {
    case "circle":
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={fillOf(shape.paint, gradientId)} opacity={shape.opacity} />;
    case "ellipse":
      return (
        <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill={fillOf(shape.paint, gradientId)} opacity={shape.opacity} />
      );
    case "rect":
      return (
        <rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          rx={shape.radius}
          fill={fillOf(shape.paint, gradientId)}
          opacity={shape.opacity}
        />
      );
    case "polygon":
      return (
        <polygon
          points={shape.points.map((point) => `${round(point.x)},${round(point.y)}`).join(" ")}
          fill={fillOf(shape.paint, gradientId)}
          opacity={shape.opacity}
        />
      );
    case "line":
      return (
        <line
          x1={shape.from.x}
          y1={shape.from.y}
          x2={shape.to.x}
          y2={shape.to.y}
          stroke={shape.color}
          strokeWidth={shape.width}
          strokeLinecap="round"
          opacity={shape.opacity}
        />
      );
    default:
      return assertNever(shape);
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A scene as an SVG that fills its box; the sky is a gradient and the shapes are painted over it. */
function SceneSvgView({ scene }: SceneSvgProps): ReactNode {
  const id = useId().replace(/:/g, "");
  const gradients: ReactNode[] = [];
  const marks = scene.shapes.map((shape, index) => {
    const gradientId = `${id}-${index}`;
    if (shape.kind !== "line" && shape.paint.kind === "linear") {
      gradients.push(
        <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shape.paint.top} />
          <stop offset="1" stopColor={shape.paint.bottom} />
        </linearGradient>,
      );
    }
    return <ShapeMark key={index} shape={shape} gradientId={gradientId} />;
  });

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${PICTURE_WIDTH} ${PICTURE_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      className="block size-full"
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={scene.sky.top} />
          <stop offset="1" stopColor={scene.sky.bottom} />
        </linearGradient>
        {gradients}
      </defs>
      <rect width={PICTURE_WIDTH} height={PICTURE_HEIGHT} fill={`url(#${id}-sky)`} />
      {marks}
    </svg>
  );
}

/** Memoised: a scene is rebuilt only when a new picture is asked for, never while it denoises. */
export const SceneSvg = memo(SceneSvgView);
