"use client";

/**
 * The round counter for any `engine: "rounds"` discipline.
 *
 * The dots are a picture and a glance has to produce a number, so the badge
 * beside them states "٣ / ١٠" out loud — twelve dots cannot be counted at
 * speed, least of all between rounds.
 *
 * A completed round is crimson and never `success`: in boxing every round in
 * the plan gets finished, so "done" here is a count, not an achievement.
 */

import { cn } from "@/lib/utils";

export function RoundTracker({
  total,
  current,
  label = "الجولات",
  className,
}: {
  total: number;
  /** 1-based index of the round being worked right now. */
  current: number;
  label?: string;
  className?: string;
}) {
  const dots = Array.from({ length: Math.max(0, total) }, (_, i) => i + 1);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-3">
          {label}
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-line-strong bg-danger/10 px-2.5 py-1 text-[11px] font-bold tracking-wider text-danger">
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          <span className="num">
            {current} / {total}
          </span>
        </span>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="تقدم الجولات">
        {dots.map((n) => {
          const done = n < current;
          const live = n === current;
          return (
            <li
              key={n}
              aria-current={live ? "step" : undefined}
              className={cn(
                "num grid size-8 place-items-center rounded-full border text-[13px] font-semibold",
                live && "border-danger bg-danger text-bg shadow-glowDanger",
                done && "border-danger/70 bg-danger/12 text-danger",
                !live && !done && "border-line-strong bg-surface-2 text-fg-3",
              )}
            >
              {n}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
