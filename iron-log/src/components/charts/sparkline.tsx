const VIEW_W = 96;
const VIEW_H = 24;

interface SparklineProps {
  values: readonly number[];
  ariaLabel: string;
}

/**
 * The 12-point trend that rides a stat tile: history in the de-emphasis hue, the
 * current period in the accent, so "where we are now" is legible at 24px tall.
 */
export function Sparkline({ values, ariaLabel }: SparklineProps) {
  const points = values.slice(-12);
  if (points.length === 0) return null;

  const max = Math.max(...points, 1);
  const band = VIEW_W / points.length;
  const barWidth = Math.max(2, band - 2);

  // SVG x-coordinates are absolute, so the bars read oldest → newest left to
  // right whatever the page direction is — no `dir` attribute needed here.
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={VIEW_W}
      height={VIEW_H}
      role="img"
      aria-label={ariaLabel}
      className="block shrink-0"
    >
      {points.map((value, index) => {
        const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
        const height = max > 0 ? Math.max(1.5, (safe / max) * VIEW_H) : 1.5;
        const isCurrent = index === points.length - 1;
        return (
          <rect
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            x={band * index + (band - barWidth) / 2}
            y={VIEW_H - height}
            width={barWidth}
            height={height}
            rx={1}
            fill={isCurrent ? "var(--viz-accent)" : "var(--viz-recessive)"}
          />
        );
      })}
    </svg>
  );
}
