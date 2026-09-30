"use client";

import { useMemo } from "react";

import {
  AxisYLabels,
  Baseline,
  GridLines,
  linePath,
  makeScale,
  niceTicks,
  paddedDomain,
  usePointerIndex,
} from "./chart-kit";

const VIEW_W = 480;
const PADDING = { top: 16, right: 16, bottom: 24, left: 44 };

export interface LinePoint {
  label: string;
  value: number;
  /** Marks a personal record — drawn as a ringed accent dot. */
  highlight?: boolean;
}

interface LineAreaChartProps {
  points: readonly LinePoint[];
  height?: number;
  formatTick: (value: number) => string;
  /** Value printed beside the final point. Omit to skip the direct label. */
  endLabel?: string;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
  ariaLabel: string;
}

/**
 * Single-series progression plot: 2px line, 10%-opacity area wash, ringed
 * end-marker, and one direct label on the last point. A single series needs no
 * legend box — the card title says what is plotted.
 */
export function LineAreaChart({
  points,
  height = 190,
  formatTick,
  endLabel,
  activeIndex,
  onActiveChange,
  ariaLabel,
}: LineAreaChartProps) {
  const innerWidth = VIEW_W - PADDING.left - PADDING.right;
  const innerHeight = height - PADDING.top - PADDING.bottom;
  const count = points.length;

  const xForIndex = useMemo(() => {
    if (count <= 1) return () => PADDING.left + innerWidth / 2;
    return (index: number) =>
      PADDING.left + (innerWidth * index) / (count - 1);
  }, [count, innerWidth]);

  const { min, max } = useMemo(
    () => paddedDomain(points.map((p) => p.value)),
    [points],
  );

  const ticks = useMemo(() => niceTicks(min, max, 4), [min, max]);
  const domainMin = Math.min(min, ticks[0] ?? min);
  const domainMax = Math.max(max, ticks[ticks.length - 1] ?? max);

  const scaleY = useMemo(
    () =>
      makeScale(
        domainMin,
        domainMax,
        PADDING.top + innerHeight,
        PADDING.top,
      ),
    [domainMin, domainMax, innerHeight],
  );

  const coords = useMemo(
    () =>
      points.map((point, index) => ({
        x: xForIndex(index),
        y: scaleY(point.value),
      })),
    [points, scaleY, xForIndex],
  );

  const { svgRef, handleMove, handleLeave } = usePointerIndex(
    count,
    xForIndex,
    VIEW_W,
    onActiveChange,
  );

  const baselineY = PADDING.top + innerHeight;
  const path = linePath(coords);
  const areaPath =
    coords.length > 0
      ? `${path} L ${coords[coords.length - 1]?.x ?? 0} ${baselineY} L ${
          coords[0]?.x ?? 0
        } ${baselineY} Z`
      : "";

  // Show at most four x labels so they can never collide.
  const labelIndices = useMemo(() => {
    if (count === 0) return [];
    if (count <= 4) return points.map((_, index) => index);
    const step = (count - 1) / 3;
    return [0, 1, 2, 3].map((i) => Math.round(i * step));
  }, [count, points]);

  const last = coords[coords.length - 1];
  const endLabelAbove = (last?.y ?? 0) > PADDING.top + 22;
  // Resolve the active point once: `noUncheckedIndexedAccess` makes repeated
  // `coords[activeIndex]` reads awkward, and one lookup is clearer anyway.
  const activeCoord = activeIndex === null ? undefined : coords[activeIndex];

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
      <Baseline y={baselineY} x1={PADDING.left} x2={VIEW_W - PADDING.right} />

      {areaPath ? (
        <path d={areaPath} fill="var(--viz-accent-wash)" stroke="none" />
      ) : null}

      <path
        d={path}
        fill="none"
        stroke="var(--viz-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Crosshair for the point currently being read. */}
      {activeCoord ? (
        <line
          x1={activeCoord.x}
          x2={activeCoord.x}
          y1={PADDING.top}
          y2={baselineY}
          stroke="var(--viz-baseline)"
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
      ) : null}

      {/* PR markers: ringed so they stay legible where they sit on the line. */}
      {points.map((point, index) => {
        const coord = coords[index];
        if (!coord || !point.highlight) return null;
        return (
          <circle
            key={`pr-${point.label}-${index}`}
            cx={coord.x}
            cy={coord.y}
            r={4}
            fill="var(--viz-accent)"
            stroke="var(--viz-surface)"
            strokeWidth={2}
          />
        );
      })}

      {/* End marker + the one direct label. */}
      {last ? (
        <>
          <circle
            cx={last.x}
            cy={last.y}
            r={4.5}
            fill="var(--viz-accent)"
            stroke="var(--viz-surface)"
            strokeWidth={2}
          />
          {endLabel ? (
            <text
              x={last.x - 6}
              y={endLabelAbove ? last.y - 10 : last.y + 16}
              textAnchor="end"
              fontSize={11}
              fontWeight={800}
              fill="var(--viz-ink)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {endLabel}
            </text>
          ) : null}
        </>
      ) : null}

      {/* Active point emphasised on top of everything. */}
      {activeCoord ? (
        <circle
          cx={activeCoord.x}
          cy={activeCoord.y}
          r={5.5}
          fill="var(--viz-accent)"
          stroke="var(--viz-surface)"
          strokeWidth={2}
        />
      ) : null}

      <g aria-hidden>
        {labelIndices.map((index) => {
          const point = points[index];
          const coord = coords[index];
          if (!point || !coord) return null;
          const anchor =
            index === 0 ? "start" : index === count - 1 ? "end" : "middle";
          return (
            <text
              key={`x-${index}`}
              x={coord.x}
              y={height - 7}
              textAnchor={anchor}
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
