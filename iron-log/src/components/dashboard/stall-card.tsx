"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { stalledLifts } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { formatNumber, formatRelativeDay } from "@/lib/utils";

/**
 * Lifts that have stopped moving.
 *
 * A progress tracker that only ever shows growth is flattering and useless. This
 * card names the lifts whose estimated 1RM has not improved across three or more
 * sessions, which is the point where the answer stops being "try harder" and
 * starts being "change something" — more sets, a lighter week, or a different
 * machine for the same muscle.
 *
 * It is deliberately quiet when there is nothing to report: an empty warning
 * card trains the eye to ignore the place warnings appear.
 */
export function StallCard() {
  const { db, index } = useIronLog();

  const rows = useMemo(() => stalledLifts(db, index, 3), [db, index]);

  if (rows.length === 0) {
    return (
      <Card className="flex items-center gap-2.5 p-4">
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
        <div>
          <p className="text-[13px] font-extrabold">ما فيه تمرين واقف</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">
            كل تمرين عنده جلستان أو أكثر ما زال يتحرك للأعلى.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="edge-molten">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <AlertTriangle className="size-4 text-primary" aria-hidden />
          تمارين واقفة
        </CardTitle>
        <CardDescription>
          ما تحسّن أقوى رقم فيها من ٣ حصص أو أكثر — المطلوب تغيير، لا تكرار
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {rows.slice(0, 5).map((row) => (
            <li key={row.exerciseId} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-extrabold">
                  {row.exerciseName}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {row.sessionsStalled} حصة
                </span>
              </div>
              <p className="tnum mt-0.5 font-mono text-[11px] text-muted-foreground">
                أفضل <bdi dir="ltr">{formatNumber(row.best1rm)}</bdi> · الآن{" "}
                <bdi dir="ltr">{formatNumber(row.latest1rm)}</bdi> · آخر حصة{" "}
                {formatRelativeDay(row.lastDate)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-border pt-2.5 text-[11px] leading-relaxed text-muted-foreground">
          جرّب واحدة من ثلاث: زِد مجموعة أسبوعياً على العضلة، أو خفّف أسبوعاً كاملاً
          ثم ارجع، أو بدّل المكينة مع الحفاظ على نفس الحركة.
        </p>
      </CardContent>
    </Card>
  );
}
