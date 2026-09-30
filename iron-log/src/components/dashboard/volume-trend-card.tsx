"use client";

import { Dumbbell } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartShell, type TableColumn } from "@/components/charts/chart-kit";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { volumeSeries } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { VolumePoint } from "@/lib/types";
import { formatCompact, formatNumber, formatShortDate } from "@/lib/utils";

const COLUMNS: readonly TableColumn<VolumePoint>[] = [
  { header: "التاريخ", cell: (row) => formatShortDate(row.date) },
  {
    header: "الحجم (كجم)",
    align: "end",
    cell: (row) => formatNumber(row.volumeKg),
  },
  { header: "المجموعات", align: "end", cell: (row) => row.setCount },
];

/**
 * Total tonnage per session — Σ (weight × reps) across working sets.
 *
 * Volume is the honest headline for "am I doing more than last month": it moves
 * when load goes up, when reps go up, and when a set is added, which is every
 * way progressive overload actually happens.
 */
export function VolumeTrendCard() {
  const { db, index } = useIronLog();
  const [active, setActive] = useState<number | null>(null);

  const series = useMemo(() => volumeSeries(db, index, 14), [db, index]);

  const points = useMemo(
    () => series.map((point) => ({ label: point.label, value: point.volumeKg })),
    [series],
  );

  if (series.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="ما فيه بيانات حجم بعد"
        description="سجّل أول مجموعة من صفحة التمرين، وأول ما تكمل حصتين يبدأ المنحنى يرتسم هنا."
      />
    );
  }

  const shown = active !== null ? series[active] : series[series.length - 1];
  const first = series[0];
  const latest = series[series.length - 1];
  const totalChange =
    first && latest && first.volumeKg > 0
      ? ((latest.volumeKg - first.volumeKg) / first.volumeKg) * 100
      : null;

  return (
    <ChartShell
      title="حجم التمرين لكل حصة"
      subtitle={
        // Worded rather than signed ("زيادة 12%" not "+12%"): a leading sign
        // inside Arabic text gets reordered by the bidi algorithm and reads as
        // "%12−".
        totalChange === null
          ? `آخر ${series.length} حصة`
          : `آخر ${series.length} حصة · ${
              totalChange >= 0 ? "زيادة" : "انخفاض"
            } ${Math.abs(Math.round(totalChange))}% من أول حصة`
      }
      readout={
        shown ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
            <span className="text-foreground">{formatShortDate(shown.date)}</span>
            <span className="tnum text-base font-extrabold text-foreground">
              {formatNumber(shown.volumeKg)}
              <span className="text-[11px] font-normal text-muted-foreground">
                {" كجم"}
              </span>
            </span>
            <span className="tnum">{shown.setCount} مجموعة</span>
            {active === null ? (
              <span className="text-muted-foreground/70">
                (آخر حصة — مرّر على الرسم للتفاصيل)
              </span>
            ) : null}
          </div>
        ) : null
      }
      tableRows={series}
      tableColumns={COLUMNS}
    >
      <LineAreaChart
        points={points}
        formatTick={formatCompact}
        endLabel={latest ? formatCompact(latest.volumeKg) : undefined}
        activeIndex={active}
        onActiveChange={setActive}
        ariaLabel="منحنى حجم التمرين لكل حصة بالكيلوجرام"
      />
    </ChartShell>
  );
}
