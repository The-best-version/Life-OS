"use client";

import { Flame } from "lucide-react";
import { useMemo } from "react";

import { ConsistencyCard } from "@/components/dashboard/consistency-card";
import { ExerciseProgressCard } from "@/components/dashboard/exercise-progress-card";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { MuscleSplitCard } from "@/components/dashboard/muscle-split-card";
import { RecordsCard } from "@/components/dashboard/records-card";
import { VolumeTrendCard } from "@/components/dashboard/volume-trend-card";
import { dashboardSummary } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";

/**
 * Progress dashboard.
 *
 * Order is deliberate: one hero figure, then the four numbers, then the charts
 * from broadest to most specific — total output → per-lift progression →
 * consistency → distribution → records.
 */
export default function DashboardPage() {
  const { db, index } = useIronLog();
  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);

  return (
    <div className="space-y-3 pb-6">
      <section className="relative iron-ember overflow-hidden py-5">
        <p className="font-mono text-[11px] text-muted-foreground">
          سلسلة أيام التدريب
        </p>
        {/* The one hero figure on this view. */}
        <p className="mt-1 flex items-baseline gap-2 text-[46px] font-black leading-none animate-rise-in">
          {summary.streak}
          <span className="text-base font-bold text-muted-foreground">يوم</span>
          {summary.streak > 0 ? (
            <Flame className="size-6 text-primary" aria-hidden />
          ) : null}
        </p>
        <p className="mt-2 text-[13px] font-medium text-muted-foreground">
          {summary.streak > 0
            ? `أطول سلسلة وصلتها ${summary.longestStreak} يوم · ${summary.totalSessions} حصة مسجّلة`
            : "ابدأ سلسلتك اليوم — سجّل حضورك أو أول مجموعة"}
        </p>
      </section>

      <KpiGrid />

      <h2 className="pt-3 text-[12.5px] font-bold text-muted-foreground">
        الحِمل والتقدم
      </h2>
      <VolumeTrendCard />
      <ExerciseProgressCard />

      <h2 className="pt-3 text-[12.5px] font-bold text-muted-foreground">
        الالتزام والتوزيع
      </h2>
      <ConsistencyCard />
      <MuscleSplitCard />

      <h2 className="pt-3 text-[12.5px] font-bold text-muted-foreground">
        الإنجازات
      </h2>
      <RecordsCard />
    </div>
  );
}
