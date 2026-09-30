"use client";

import { Trophy } from "lucide-react";
import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { personalRecords } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { formatNumber, formatRelativeDay, formatSigned } from "@/lib/utils";

/** The most recent personal records, newest first. */
export function RecordsCard() {
  const { db, index } = useIronLog();

  const records = useMemo(() => personalRecords(db, index, 8), [db, index]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>آخر الأرقام القياسية</CardTitle>
        <CardDescription>
          كل مرة تتجاوز فيها أثقل وزن سجّلته لنفس التمرين
        </CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="ما فيه أرقام قياسية بعد"
            description="أول حصة تُعتبر خط الأساس. أول ما تتجاوز وزنها في نفس التمرين، يُسجّل رقم قياسي هنا."
            className="border-0 py-6"
          />
        ) : (
          <ul className="divide-y divide-border">
            {records.map((record) => (
              <li
                key={`${record.exerciseId}-${record.date}`}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                >
                  <Trophy className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">
                    {record.exerciseName}
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {formatRelativeDay(record.date)}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className="tnum text-sm font-extrabold">
                    {formatNumber(record.weightKg)}
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {` كجم × ${record.reps}`}
                    </span>
                  </p>
                  {record.gainKg !== null ? (
                    <p className="tnum font-mono text-[11px] font-bold text-success">
                      {/* LTR isolate so the "+" stays in front of the number. */}
                      <bdi dir="ltr">{formatSigned(record.gainKg)}</bdi> كجم
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
