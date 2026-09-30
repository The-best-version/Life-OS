import type { ReactNode } from "react";

import { clamp, cn } from "@/lib/utils";

export interface BarListRow {
  key: string;
  label: string;
  value: number;
  /** Formatted value printed at the tip of the bar. */
  display: string;
  /** Secondary note, e.g. the set count. */
  note?: ReactNode;
}

interface BarListProps {
  rows: readonly BarListRow[];
  className?: string;
}

/**
 * Horizontal magnitude comparison, built in HTML rather than SVG.
 *
 * A horizontal bar chart has no time axis, so it reads correctly right-to-left
 * with the rest of the page — and as plain DOM, every label and value is already
 * selectable text for a screen reader. One measure, one colour: magnitude is
 * carried by length, never by hue.
 */
export function BarList({ rows, className }: BarListProps) {
  const max = rows.reduce((best, row) => Math.max(best, row.value), 0);

  return (
    <ul className={cn("space-y-2.5", className)}>
      {rows.map((row) => {
        const pct = max > 0 ? clamp((row.value / max) * 100, 2, 100) : 0;
        return (
          <li key={row.key}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate font-bold text-foreground">
                {row.label}
              </span>
              <span className="tnum shrink-0 font-mono text-muted-foreground">
                {row.display}
                {row.note ? (
                  <span className="text-muted-foreground/70">
                    {" · "}
                    {row.note}
                  </span>
                ) : null}
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-sm bg-secondary">
              <div
                className="h-full rounded-e-sm rounded-s-none bg-primary transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
