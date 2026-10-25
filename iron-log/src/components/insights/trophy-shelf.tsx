"use client";

/**
 * Every discipline's bests on one shelf.
 *
 * Each record is judged the way its own sport says — `better: "max"` for
 * heavier, longer and further, `better: "min"` for faster — so a fastest pace
 * and a longest circuit sit side by side with no branch above
 * `athleticRecords()`.
 *
 * A fresh record gets the volt glow and says "رقم جديد" in words; a standing
 * one shows its date. The sport's hue reaches the trophy icon and stops there:
 * a PR is volt in every discipline, or a record in boxing would read as a
 * different kind of thing from a record in running.
 */

import { Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AthleticRecord } from "@/lib/types";
import { cn, formatShortDate } from "@/lib/utils";

export function TrophyShelf({
  records,
  className,
}: {
  records: AthleticRecord[];
  className?: string;
}) {
  return (
    <Card
      aria-label="الأرقام الشخصية"
      className={cn("flex flex-col gap-4 p-4 sm:p-6", className)}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-3">
            رفّ الإنجازات
          </p>
          <h2 className="text-[17px] font-bold leading-tight text-fg">
            أفضل ما سجلته
          </h2>
        </div>
        {records.length > 0 ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-accent/10 px-2.5 py-1 text-[11px] font-bold tracking-wider text-accent">
            <Trophy className="size-3.5" aria-hidden />
            <span className="num">{records.length}</span>
          </span>
        ) : null}
      </div>

      {records.length === 0 ? (
        /* A blank grid and a broken grid look identical, so the empty state
           says which one this is. */
        <p className="text-[13px] leading-relaxed text-fg-2">
          لا أرقام بعد. سجّل حصة في أي رياضة — ملاكمة، فروسية، جري — وأول رقم
          يظهر هنا.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {records.map((record) => (
            <li
              key={`${record.sport}-${record.key}`}
              style={
                { "--sport": `hsl(var(${record.accentVar}))` } as React.CSSProperties
              }
              className={cn(
                "flex flex-col gap-2 rounded-xl border p-4",
                record.fresh
                  ? "border-accent bg-accent/[0.08] shadow-glowAccent"
                  : "border-line bg-surface-2",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-3">
                  {record.sportName}
                </span>
                <Trophy className="size-[18px] text-[var(--sport)]" aria-hidden />
              </div>

              <span className="text-[13px] text-fg-2">{record.label}</span>

              <div className="flex items-baseline gap-1.5">
                <span className="num text-[28px] font-semibold leading-none text-fg">
                  {record.display}
                </span>
                <span className="text-[12px] font-semibold text-fg-2">
                  {record.unit}
                </span>
              </div>

              {record.fresh ? (
                <span className="flex w-fit items-center gap-1.5 rounded-full border border-accent/50 bg-accent/10 px-2 py-0.5 text-[11px] font-bold tracking-wider text-accent">
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                  رقم جديد
                </span>
              ) : (
                <span className="text-[13px] text-fg-3">
                  {formatShortDate(record.date)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
