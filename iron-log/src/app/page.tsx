"use client";

import { useMemo } from "react";

import { ConsistencyCard } from "@/components/dashboard/consistency-card";
import { ExerciseProgressCard } from "@/components/dashboard/exercise-progress-card";
import { StudioHero } from "@/components/dashboard/studio-hero";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { MuscleSplitCard } from "@/components/dashboard/muscle-split-card";
import { RecordsCard } from "@/components/dashboard/records-card";
import { StallCard } from "@/components/dashboard/stall-card";
import { VolumeLandmarksCard } from "@/components/dashboard/volume-landmarks-card";
import { VolumeTrendCard } from "@/components/dashboard/volume-trend-card";
import { dashboardSummary } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";

/**
 * Progress dashboard.
 *
 * Order is deliberate: the hero, then the four numbers, then the charts from
 * broadest to most specific — total output → per-lift progression → the weekly
 * dose per muscle → consistency → distribution → what has stalled → records. The
 * two diagnostic cards sit late on purpose: they are the ones that ask for a
 * decision, and a decision is easier after the context above it.
 *
 * On a wide window the sections split into two columns rather than growing one
 * 1000px-wide chart. A chart that wide is not more readable, it is just further
 * from the number beside it.
 */
export default function DashboardPage() {
  const { db, index } = useIronLog();
  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);

  return (
    <div className="space-y-3 pb-6">
      <StudioHero summary={summary} />

      <KpiGrid />

      <div className="gap-x-4 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="space-y-3">
          <SectionLabel>الحِمل والتقدم</SectionLabel>
          <VolumeTrendCard />
          <ExerciseProgressCard />

          <SectionLabel>الالتزام والتوزيع</SectionLabel>
          <ConsistencyCard />
          <MuscleSplitCard />
        </div>

        <div className="space-y-3">
          <SectionLabel>الجرعة الأسبوعية لكل عضلة</SectionLabel>
          <VolumeLandmarksCard />

          <SectionLabel>تشخيص</SectionLabel>
          <StallCard />

          <SectionLabel>الإنجازات</SectionLabel>
          <RecordsCard />
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="section-label pt-4 text-[12.5px] font-bold text-muted-foreground">
      {children}
    </h2>
  );
}
