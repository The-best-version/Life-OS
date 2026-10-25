"use client";

/**
 * The week, across every discipline at once.
 *
 * One ring per sport, each measured against THAT sport's own weekly target —
 * so two rides and one run read as a week that happened rather than a failed
 * gym week.
 *
 * The legend is not decoration. A ring cannot be read back to a figure, so
 * every row states `done / target` in tabular numerals and repeats the
 * fraction as a bar; the rings are the shape of the week and the rows are the
 * week. Nothing here sums the rings into one percentage, because the whole
 * point of the screen is that the week was spent across four kinds of
 * training, and a single number would erase exactly that.
 */

import { Zap } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { SportLoadRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZE = 188;
const STROKE = 13;
const GAP = 5;

export function WeeklyLoadRadar({
  rows,
  totalStrain,
  streak,
  className,
}: {
  rows: SportLoadRow[];
  totalStrain: number;
  /** Consecutive days with a session in ANY discipline. */
  streak: number;
  className?: string;
}) {
  const rings = rows.map((row, i) => {
    const r = SIZE / 2 - STROKE / 2 - i * (STROKE + GAP);
    return { row, r, c: 2 * Math.PI * r };
  });

  return (
    <Card
      aria-label="الحمل الأسبوعي"
      className={cn("flex flex-col gap-5 p-4 sm:p-6", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-3">
            هذا الأسبوع
          </p>
          <h2 className="text-[17px] font-bold leading-tight text-fg">
            الحمل بكل الرياضات
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-line-strong bg-surface-2 px-2.5 py-1 text-[11px] font-bold tracking-wider text-fg-2">
          <span className="num">{totalStrain}</span> حمل
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90 shrink-0"
          aria-hidden
        >
          {rings.map(({ row, r, c }) => (
            <g key={row.sport}>
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={r}
                fill="none"
                stroke="var(--viz-grid)"
                strokeWidth={STROKE}
              />
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={r}
                fill="none"
                stroke={`hsl(var(${row.accentVar}))`}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - row.progress)}
                style={{ transition: "stroke-dashoffset 500ms cubic-bezier(0.22,1,0.36,1)" }}
              />
            </g>
          ))}
        </svg>

        <ul className="flex min-w-[180px] flex-1 flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.sport}
              style={{ "--sport": `hsl(var(${row.accentVar}))` } as React.CSSProperties}
              className="flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-sm bg-[var(--sport)]"
                />
                <span className="flex-1 text-[13px] text-fg">{row.nameAr}</span>
                <span className="num text-[14px] text-fg-2">
                  {row.sessions} / {row.target}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-[var(--sport)] transition-[width] duration-500"
                  style={{ width: `${Math.round(row.progress * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-line-strong bg-accent/[0.07] p-3">
        <Zap className="size-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0">
          <p className="num text-[24px] font-semibold leading-none text-fg">
            {streak} <span className="font-sans text-[13px] text-fg-2">يوم</span>
          </p>
          <p className="mt-1 text-[13px] leading-snug text-fg-2">
            أي رياضة تحتسب — ركوب يوم الثلاثاء يحفظ السلسلة مثل حصة حديد.
          </p>
        </div>
      </div>
    </Card>
  );
}
