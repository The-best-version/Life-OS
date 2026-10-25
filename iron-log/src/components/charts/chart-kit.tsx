"use client";

/**
 * Shared chart scaffolding.
 *
 * Everything is hand-rolled inline SVG rather than a charting library. Three
 * reasons: the bundle stays tiny, the marks follow the project's own spec
 * exactly (2px lines, ≤24px bars, 4px rounded data-ends, 2px surface rings),
 * and there is no third-party React-version compatibility to babysit.
 *
 * Sizing: charts render into a fixed `viewBox` and scale with their container.
 * The app shell is capped at ~560px, so the scale factor stays near 1 and stroke
 * widths read as designed on every phone.
 *
 * Direction: the plot itself is `dir="ltr"` so time always runs left → right,
 * while all labels stay Arabic. Mixing an RTL time axis with Arabic numerals is
 * the kind of thing that quietly makes a reader misread a trend.
 */

import { Table2, TrendingUp } from "lucide-react";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Scales & ticks                                                      */
/* ------------------------------------------------------------------ */

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function makeScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
): (value: number) => number {
  const span = domainMax - domainMin;
  if (!Number.isFinite(span) || span === 0) {
    const mid = (rangeMin + rangeMax) / 2;
    return () => mid;
  }
  return (value: number) =>
    rangeMin + ((value - domainMin) / span) * (rangeMax - rangeMin);
}

/**
 * Round, human tick values covering [min, max] — 0 / 500 / 1,000, never
 * 0 / 483.33 / 966.67.
 */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (max === min) {
    return max === 0 ? [0, 1] : [0, max];
  }
  const rawStep = (max - min) / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step =
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) *
    magnitude;

  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  // Guard against a pathological step producing an unbounded loop.
  for (let value = start, i = 0; value <= end + step / 2 && i < 40; value += step, i += 1) {
    ticks.push(Number(value.toFixed(6)));
  }
  return ticks;
}

/**
 * Pad a value domain so a flat-ish series does not render as a line glued to the
 * top edge, while a series that touches zero keeps zero as its baseline.
 */
export function paddedDomain(
  values: readonly number[],
): { min: number; max: number } {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return { min: 0, max: 1 };

  let min = Math.min(...finite);
  let max = Math.max(...finite);

  if (min === max) {
    const bump = Math.max(1, Math.abs(max) * 0.1);
    return { min: Math.max(0, min - bump), max: max + bump };
  }

  const span = max - min;
  min = Math.max(0, min - span * 0.12);
  max = max + span * 0.12;
  return { min, max };
}

/** Smooth-ish path through points using a monotone-safe cubic. */
export function linePath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const first = points[0];
  if (!first) return "";
  if (points.length === 1) return `M ${first.x} ${first.y}`;

  let d = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    if (!prev || !curr) continue;
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

/* ------------------------------------------------------------------ */
/* Chrome pieces                                                       */
/* ------------------------------------------------------------------ */

export function GridLines({
  ticks,
  scaleY,
  x1,
  x2,
}: {
  ticks: readonly number[];
  scaleY: (value: number) => number;
  x1: number;
  x2: number;
}) {
  return (
    <g aria-hidden>
      {ticks.map((tick) => (
        <line
          key={tick}
          x1={x1}
          x2={x2}
          y1={scaleY(tick)}
          y2={scaleY(tick)}
          stroke="var(--viz-grid)"
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
      ))}
    </g>
  );
}

export function AxisYLabels({
  ticks,
  scaleY,
  x,
  format,
}: {
  ticks: readonly number[];
  scaleY: (value: number) => number;
  x: number;
  format: (value: number) => string;
}) {
  return (
    <g aria-hidden>
      {ticks.map((tick) => (
        <text
          key={tick}
          x={x}
          y={scaleY(tick) + 3.5}
          textAnchor="end"
          fontSize={9.5}
          fill="var(--viz-ink-muted)"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {format(tick)}
        </text>
      ))}
    </g>
  );
}

export function Baseline({
  y,
  x1,
  x2,
}: {
  y: number;
  x1: number;
  x2: number;
}) {
  return (
    <line
      aria-hidden
      x1={x1}
      x2={x2}
      y1={y}
      y2={y}
      stroke="var(--viz-baseline)"
      strokeWidth={1}
      shapeRendering="crispEdges"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Pointer tracking                                                    */
/* ------------------------------------------------------------------ */

/**
 * Map a pointer event to the nearest data index.
 *
 * The SVG scales with its container, so client pixels are converted through the
 * element's own bounding box rather than assuming a 1:1 viewBox mapping.
 */
export function usePointerIndex(
  count: number,
  xForIndex: (index: number) => number,
  viewWidth: number,
  onChange: (index: number | null) => void,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || count === 0) return;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0) return;

      const x = ((event.clientX - rect.left) / rect.width) * viewWidth;

      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let i = 0; i < count; i += 1) {
        const distance = Math.abs(xForIndex(i) - x);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      }
      onChange(best);
    },
    [count, viewWidth, xForIndex, onChange],
  );

  const handleLeave = useCallback(() => onChange(null), [onChange]);

  return { svgRef, handleMove, handleLeave };
}

/* ------------------------------------------------------------------ */
/* Chart shell — title, readout, chart/table toggle                    */
/* ------------------------------------------------------------------ */

export interface TableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: "start" | "end";
}

interface ChartShellProps<T> {
  title: string;
  subtitle?: string;
  /** The live readout line: values for the hovered point, or the latest point. */
  readout?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
  tableRows?: readonly T[];
  tableColumns?: readonly TableColumn<T>[];
  className?: string;
}

/**
 * Wraps a plot with its title, a readout line and a table view.
 *
 * The readout replaces a floating tooltip on purpose: on a phone a finger sits
 * exactly where a tooltip would appear, so the values are shown in a fixed line
 * above the plot instead — and a crosshair marks which point they belong to. The
 * table view is the non-visual channel; it is always one tap away.
 */
export function ChartShell<T>({
  title,
  subtitle,
  readout,
  legend,
  children,
  tableRows,
  tableColumns,
  className,
}: ChartShellProps<T>) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const tableId = useId();
  const hasTable = Boolean(tableRows?.length && tableColumns?.length);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-bold leading-tight tracking-tight text-fg">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs font-medium text-fg-3">{subtitle}</p> : null}
        </div>
        {hasTable ? (
          <button
            type="button"
            onClick={() => setView((v) => (v === "chart" ? "table" : "chart"))}
            aria-pressed={view === "table"}
            aria-controls={tableId}
            className="shrink-0 rounded-lg border border-line-strong bg-surface-2 p-2 text-fg-2 transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            title={view === "chart" ? "عرض الأرقام كجدول" : "عرض الرسم"}
          >
            {view === "chart" ? (
              <Table2 className="size-4" aria-hidden />
            ) : (
              <TrendingUp className="size-4" aria-hidden />
            )}
            <span className="sr-only">
              {view === "chart" ? "عرض الأرقام كجدول" : "عرض الرسم"}
            </span>
          </button>
        ) : null}
      </div>

      {readout ? <div className="px-4 pb-1">{readout}</div> : null}

      <div id={tableId} className="px-2 pb-3">
        {view === "chart" ? (
          <div dir="ltr">{children}</div>
        ) : (
          <div className="max-h-[260px] overflow-auto px-2">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-surface">
                <tr className="text-fg-3">
                  {tableColumns?.map((column) => (
                    <th
                      key={column.header}
                      scope="col"
                      className={cn(
                        "py-1.5 font-semibold",
                        column.align === "end" ? "text-end" : "text-start",
                      )}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows?.map((row, rowIndex) => (
                  <tr
                    // eslint-disable-next-line react/no-array-index-key
                    key={rowIndex}
                    className="border-t border-line"
                  >
                    {tableColumns?.map((column) => (
                      <td
                        key={column.header}
                        className={cn(
                          "py-1.5 font-bold",
                          column.align === "end" ? "text-end" : "text-start",
                        )}
                      >
                        {column.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {legend ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2.5 text-[11px] text-fg-3">
          {legend}
        </div>
      ) : null}
    </Card>
  );
}

export function LegendKey({
  color,
  label,
  shape = "line",
}: {
  color: string;
  label: string;
  shape?: "line" | "dot" | "swatch";
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {shape === "line" ? (
        <span
          aria-hidden
          className="h-0.5 w-4 rounded-full"
          style={{ background: color }}
        />
      ) : shape === "dot" ? (
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ background: color }}
        />
      ) : (
        <span
          aria-hidden
          className="size-2.5 rounded-sm"
          style={{ background: color }}
        />
      )}
      <span>{label}</span>
    </span>
  );
}
