"use client";

import { LineChart, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  ChartShell,
  LegendKey,
  type TableColumn,
} from "@/components/charts/chart-kit";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { chartableExerciseIds, exerciseProgress } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { ExerciseProgressPoint } from "@/lib/types";
import { formatNumber, formatShortDate } from "@/lib/utils";

type Metric = "topWeight" | "e1rm";

const COLUMNS: readonly TableColumn<ExerciseProgressPoint>[] = [
  { header: "التاريخ", cell: (row) => formatShortDate(row.date) },
  {
    header: "أقصى وزن",
    align: "end",
    // "55 × 10" is two numbers around a neutral: inside RTL text the bidi
    // algorithm flips them to "10 × 55", which reads as the wrong lift. An LTR
    // isolate pins the order.
    cell: (row) => (
      <bdi dir="ltr">
        {formatNumber(row.topWeightKg)} × {row.topSetReps}
      </bdi>
    ),
  },
  {
    header: "1RM مقدّر",
    align: "end",
    cell: (row) => formatNumber(row.estimated1rm),
  },
  { header: "الحجم", align: "end", cell: (row) => formatNumber(row.volumeKg) },
];

/**
 * Per-exercise progression. Two metrics, one at a time — never two y-scales on
 * one plot:
 *
 *  · أقصى وزن   — the heaviest working set that day. What you feel in the gym.
 *  · 1RM مقدّر  — Epley estimate, which also rewards adding reps at the same load.
 */
export function ExerciseProgressCard() {
  const { db, index } = useIronLog();
  const [metric, setMetric] = useState<Metric>("topWeight");
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);

  const candidates = useMemo(
    () => chartableExerciseIds(db, index),
    [db, index],
  );

  // Keep the selection valid as history grows or the chosen lift is removed.
  useEffect(() => {
    if (candidates.length === 0) {
      if (exerciseId !== null) setExerciseId(null);
      return;
    }
    if (exerciseId === null || !candidates.includes(exerciseId)) {
      setExerciseId(candidates[0] ?? null);
    }
  }, [candidates, exerciseId]);

  const points = useMemo(
    () => (exerciseId ? exerciseProgress(index, exerciseId) : []),
    [index, exerciseId],
  );

  useEffect(() => {
    setActive(null);
  }, [exerciseId, metric]);

  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={LineChart}
        title="محتاج حصتين على الأقل لنفس التمرين"
        description="منحنى التقدم يظهر أول ما تسجّل نفس التمرين في يومين مختلفين — عشان يكون هناك شيء نقارنه."
      />
    );
  }

  const chartPoints = points.map((point) => ({
    label: formatShortDate(point.date),
    value: metric === "topWeight" ? point.topWeightKg : point.estimated1rm,
    highlight: point.isPr,
  }));

  const shown = active !== null ? points[active] : points[points.length - 1];
  const best = points.reduce(
    (max, point) => Math.max(max, point.topWeightKg),
    0,
  );
  const lastValue = chartPoints[chartPoints.length - 1]?.value;
  const exerciseName = exerciseId
    ? (index.exerciseNameById.get(exerciseId) ?? "تمرين")
    : "تمرين";

  return (
    <ChartShell
      title="تقدّم التمرين"
      subtitle={`أفضل رقم: ${formatNumber(best)} كجم`}
      readout={
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <Select
              value={exerciseId ?? ""}
              onChange={(event) => setExerciseId(event.target.value)}
              aria-label="اختر التمرين"
              className="h-10 flex-1 text-[13px]"
            >
              {candidates.map((id) => (
                <option key={id} value={id}>
                  {index.exerciseNameById.get(id) ?? id}
                </option>
              ))}
            </Select>
            <div className="flex shrink-0 gap-1">
              <Button
                size="sm"
                variant={metric === "topWeight" ? "default" : "secondary"}
                onClick={() => setMetric("topWeight")}
                aria-pressed={metric === "topWeight"}
                className="h-10"
              >
                أقصى وزن
              </Button>
              <Button
                size="sm"
                variant={metric === "e1rm" ? "default" : "secondary"}
                onClick={() => setMetric("e1rm")}
                aria-pressed={metric === "e1rm"}
                className="h-10"
              >
                1RM
              </Button>
            </div>
          </div>

          {shown ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
              <span className="text-foreground">
                {formatShortDate(shown.date)}
              </span>
              <span className="tnum text-base font-extrabold text-foreground">
                {formatNumber(shown.topWeightKg)}
                <span className="text-[11px] font-normal text-muted-foreground">
                  {` كجم × ${shown.topSetReps}`}
                </span>
              </span>
              <span className="tnum">
                1RM ≈ {formatNumber(shown.estimated1rm)}
              </span>
              {shown.isPr ? (
                <Badge>
                  <Trophy className="size-3" aria-hidden />
                  رقم قياسي
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      }
      legend={
        <>
          <LegendKey
            color="var(--viz-accent)"
            label={metric === "topWeight" ? "أقصى وزن (كجم)" : "1RM مقدّر (كجم)"}
          />
          <LegendKey
            color="var(--viz-accent)"
            shape="dot"
            label="نقطة دائرية = رقم قياسي"
          />
        </>
      }
      tableRows={points}
      tableColumns={COLUMNS}
    >
      <LineAreaChart
        points={chartPoints}
        formatTick={formatNumber}
        endLabel={
          lastValue === undefined ? undefined : formatNumber(lastValue)
        }
        activeIndex={active}
        onActiveChange={setActive}
        ariaLabel={`منحنى تقدّم ${exerciseName} بالكيلوجرام`}
      />
    </ChartShell>
  );
}
