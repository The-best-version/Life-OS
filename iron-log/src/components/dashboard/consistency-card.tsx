"use client";

import { CalendarCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartShell, type TableColumn } from "@/components/charts/chart-kit";
import { ColumnChart } from "@/components/charts/column-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { weeklyBuckets } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { WeeklyBucket } from "@/lib/types";
import { formatNumber, formatShortDate } from "@/lib/utils";

const COLUMNS: readonly TableColumn<WeeklyBucket>[] = [
  { header: "بداية الأسبوع", cell: (row) => formatShortDate(row.weekStart) },
  { header: "أيام التدريب", align: "end", cell: (row) => row.attended },
  {
    header: "الحجم (كجم)",
    align: "end",
    cell: (row) => formatNumber(row.volumeKg),
  },
];

/**
 * Weekly attendance against the goal. The week opens on Saturday, matching the
 * Gulf training week, so "this week" means what the user means by it.
 */
export function ConsistencyCard() {
  const { db, index } = useIronLog();
  const [active, setActive] = useState<number | null>(null);

  const weeks = useMemo(() => weeklyBuckets(db, index, 8), [db, index]);
  const hasData = weeks.some((week) => week.attended > 0);

  const points = useMemo(
    () => weeks.map((week) => ({ label: week.label, value: week.attended })),
    [weeks],
  );

  if (!hasData) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="ما فيه أيام حضور مسجّلة"
        description="سجّل حضورك من صفحة التمرين، أو سجّل أي مجموعة — الاثنان يحسبان يوم تدريب."
      />
    );
  }

  const shown = active !== null ? weeks[active] : weeks[weeks.length - 1];
  const average =
    weeks.length > 0
      ? weeks.reduce((total, week) => total + week.attended, 0) / weeks.length
      : 0;

  return (
    <ChartShell
      title="الالتزام الأسبوعي"
      subtitle={`متوسط ${formatNumber(average)} يوم في الأسبوع · الهدف ${db.settings.weeklyGoal}`}
      readout={
        shown ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <span className="text-foreground">
              أسبوع {formatShortDate(shown.weekStart)}
            </span>
            <span className="tnum text-base font-extrabold text-foreground">
              {shown.attended}
              <span className="text-[11px] font-normal text-muted-foreground">
                {` / ${db.settings.weeklyGoal} يوم`}
              </span>
            </span>
            <span className="tnum">{formatNumber(shown.volumeKg)} كجم</span>
          </div>
        ) : null
      }
      tableRows={weeks}
      tableColumns={COLUMNS}
    >
      <ColumnChart
        points={points}
        formatTick={(value) => String(Math.round(value))}
        target={db.settings.weeklyGoal}
        targetLabel="الهدف"
        activeIndex={active}
        onActiveChange={setActive}
        ariaLabel="أعمدة أيام التدريب في كل أسبوع مقابل الهدف الأسبوعي"
      />
    </ChartShell>
  );
}
