"use client";

import { Activity } from "lucide-react";
import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { weeklySetsByMuscle } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { MuscleVolumeRow, VolumeStatus } from "@/lib/types";
import { cn, clamp } from "@/lib/utils";

const STATUS_LABEL: Record<VolumeStatus, string> = {
  none: "مهملة",
  under: "أقل من الحد",
  optimal: "في النطاق",
  peak: "قرب السقف",
  over: "فوق السقف",
};

/**
 * Weekly sets per muscle against the hypertrophy landmarks.
 *
 * This is the one card that answers a question a list of numbers cannot: not
 * "how much did I lift" but "is each muscle getting a productive dose". The
 * measure is sets per week per muscle, because that is the unit the
 * dose-response research is expressed in — and because tonnage is not comparable
 * across muscles, where one set of leg press moves four times the weight of a
 * set of lateral raises without being four times the stimulus.
 *
 * Colour never carries the verdict alone: every row prints its status in words
 * and its own sentence of advice underneath.
 */
export function VolumeLandmarksCard() {
  const { db, index } = useIronLog();

  const rows = useMemo(() => weeklySetsByMuscle(db, index, 7), [db, index]);
  const trained = rows.filter((row) => row.sets > 0);

  const needsWork = rows.filter(
    (row) => row.status === "under" || row.status === "over",
  );

  return (
    <Card className="edge-molten">
      <CardHeader>
        <CardTitle>حجم الأسبوع مقابل النطاق المنتج</CardTitle>
        <CardDescription>
          مجموعات فعلية لكل عضلة في آخر ٧ أيام · النطاق من أدبيات التضخيم، ثابت
          ولا يتحرك مع أدائك
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {trained.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="ما فيه مجموعات هذا الأسبوع"
            description="أول ما تسجّل مجموعات، يقيس لك هذا الجدول كل عضلة مقابل حدها الأدنى وسقفها الأسبوعي."
            className="border-0 py-6"
          />
        ) : (
          <>
            {trained.map((row) => (
              <LandmarkRow key={row.group} row={row} />
            ))}

            {needsWork.length > 0 ? (
              <p className="border-t border-border pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                <span className="font-extrabold text-foreground">
                  الخلاصة:{" "}
                </span>
                {needsWork
                  .map((row) => `${row.label} — ${row.advice}`)
                  .join(" · ")}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LandmarkRow({ row }: { row: MuscleVolumeRow }) {
  /* The track is scaled past MRV on purpose: a muscle that is over the ceiling
     has to show *how far* over, and a track that stops at MRV would pin every
     overreach to the same full bar. */
  const span = Math.max(row.mrv * 1.25, row.sets * 1.05, 1);
  const pct = (value: number) => clamp((value / span) * 100, 0, 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] font-extrabold">{row.label}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="figure text-[15px]">{row.sets}</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            مجموعة
          </span>
          <span
            className={cn(
              "rounded-full border px-1.5 py-0.5 text-[9.5px] font-extrabold",
              row.status === "optimal" &&
                "border-success/40 bg-success/15 text-success",
              row.status === "peak" && "border-border bg-secondary text-foreground",
              (row.status === "under" || row.status === "none" || row.status === "over") &&
                "border-primary/40 bg-primary/15 text-primary",
            )}
          >
            {STATUS_LABEL[row.status]}
          </span>
        </span>
      </div>

      {/* The zones, then the marker. Left-to-right: the axis is a quantity. */}
      <div dir="ltr" className="relative mt-1.5 h-2.5 rounded-sm bg-secondary">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 rounded-s-sm bg-primary/15"
          style={{ width: `${pct(row.mev)}%` }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 bg-success/25"
          style={{
            left: `${pct(row.mev)}%`,
            width: `${pct(row.mav) - pct(row.mev)}%`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-y-0 bg-success/12"
          style={{
            left: `${pct(row.mav)}%`,
            width: `${pct(row.mrv) - pct(row.mav)}%`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-y-[-3px] w-[3px] rounded-full bg-foreground"
          style={{ left: `calc(${pct(row.sets)}% - 1.5px)` }}
        />
      </div>

      <p className="mt-1 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>{row.advice}</span>
        <span dir="ltr" className="tnum shrink-0">
          {row.mev} · {row.mav} · {row.mrv}
        </span>
      </p>
    </div>
  );
}
