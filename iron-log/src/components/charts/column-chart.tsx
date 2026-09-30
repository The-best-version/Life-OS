"use client";

import { useMemo } from "react";

import {
  AxisYLabels,
  Baseline,
  GridLines,
  makeScale,
  niceTicks,
  usePointerIndex,
} from "./chart-kit";

const VIEW_W = 480;
const PADDING = { top: 16, right: 16, bottom: 24, left: 44 };
const MAX_BAR = 24;

export interface ColumnPoint {
  label: string;
  value: number;
}

interface ColumnChartProps {
  points: readonly ColumnPoint[];
  height?: number;
  formatTick: (value: number) => string;
  /** Optional goal line, e.g. the weekly session target. */
  target?: number | null;
  targetLabel?: string;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
  ariaLabel: string;
}

/**
 * Columns grow from a single baseline: ≤24px thick, 4px rounded cap, square at
 * the baseline, with a 2px surface gap between neighbours.
 */
export function ColumnChart({
  points,
  height = 170,
  formatTick,
  target = null,
  targetLabel,
  activeIndex,
  onActiveChange,
  ariaLabel,
}: ColumnChartProps) {
  const innerWidth = VIEW_W - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;
  const count = points.length;

  const band = count > 0 ? innerWidth / count : innerWidth;
  const barWidth = Math.max(4, Math.min(MAX_BAR, band - 2));

  const xForIndex = useMemo(
    () => (index: number) => PADDING.left + band * index + band / 2,
    [band],
  );

  const maxValue = useMemo(() => {
    const values = points.map((p) => p.value);
    if (target !== null && Number.isFinite(target)) values.push(target);
    const max = values.length > 0 ? Math.max(...values) : 0;
    return max > 0 ? max : 1;
  }, [points, target]);

  const ticks = useMemo(() => niceTicks(0, maxValue, 3), [maxValue]);
  const domainMax = Math.max(maxValue, ticks[ticks.length - 1] ?? maxValue);

  const baselineY = PADDING.top + innerHeight;
  const scaleY = useMemo(
    () => makeScale(0, domainMax, baselineY, PADDING.top),
    [domainMax, baselineY],
  );

  const { svgRef, handleMove, handleLeave } = usePointerIndex(
    count,
    xForIndex,
    VIEW_W,
    onActiveChange,
  );

  // At most six x labels; beyond that they collide at phone width.
  const labelStep = count > 6 ? Math.ceil(count / 6) : 1;

  if (count === 0) return null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${height}`}
      // Sized in CSS, not attributes: `height="auto"` is not a valid SVG length
      // and browsers log a console error for it.
      role="img"
      aria-label={ariaLabel}
      className="block h-auto w-full touch-pan-y select-none"
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <GridLines
        ticks={ticks}
        scaleY={scaleY}
        x1={PADDING.left}
        x2={VIEW_W - PADDING.right}
      />
      <AxisYLabels
        ticks={ticks}
        scaleY={scaleY}
        x={PADDING.left - 8}
        format={formatTick}
      />

      {points.map((point, index) => {
        const value = Number.isFinite(point.value) ? Math.max(0, point.value) : 0;
        const y = scaleY(value);
        const barHeight = Math.max(0, baselineY - y);
        const x = xForIndex(index) - barWidth / 2;
        const radius = Math.min(4, barWidth / 2, barHeight);
        const isActive = activeIndex === index;

        if (barHeight <= 0) {
          // Zero weeks still get a 2px stub so the gap in the series is visible.
          return (
            <rect
              key={`${point.label}-${index}`}
              x={x}
              y={baselineY - 2}
              width={barWidth}
              height={2}
              fill="var(--viz-recessive)"
            />
          );
        }

        const d = [
          `M ${x} ${baselineY}`,
          `L ${x} ${y + radius}`,
          `Q ${x} ${y} ${x + radius} ${y}`,
          `L ${x + barWidth - radius} ${y}`,
          `Q ${x + barWidth} ${y} ${x + barWidth} ${y + radius}`,
          `L ${x + barWidth} ${baselineY}`,
          "Z",
        ].join(" ");

        return (
          <path
            key={`${point.label}-${index}`}
            d={d}
            fill="var(--viz-accent)"
            opacity={activeIndex === null || isActive ? 1 : 0.5}
          />
        );
      })}

      {target !== null && Number.isFinite(target) && target > 0 ? (
        <g aria-hidden>
          <line
            x1={PADDING.left}
            x2={VIEW_W - PADDING.right}
            y1={scaleY(target)}
            y2={scaleY(target)}
            stroke="var(--viz-ink-muted)"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
          {targetLabel ? (
            <text
              x={VIEW_W - PADDING.right}
              y={scaleY(target) - 5}
              textAnchor="end"
              fontSize={9.5}
              fill="var(--viz-ink-muted)"
            >
              {targetLabel}
            </text>
          ) : null}
        </g>
      ) : null}

      <Baseline y={baselineY} x1={PADDING.left} x2={VIEW_W - PADDING.right} />

      <g aria-hidden>
        {points.map((point, index) => {
          if (index % labelStep !== 0 && index !== count - 1) return null;
          return (
            <text
              key={`x-${point.label}-${index}`}
              x={xForIndex(index)}
              y={height - 7}
              textAnchor="middle"
              fontSize={9.5}
              fill="var(--viz-ink-muted)"
            >
              {point.label}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
