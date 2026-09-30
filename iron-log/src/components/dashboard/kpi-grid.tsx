"use client";

import { useMemo } from "react";

import { StatTile } from "@/components/dashboard/stat-tile";
import { dashboardSummary } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { formatCompact } from "@/lib/utils";

/** The four numbers worth seeing before any chart. */
export function KpiGrid() {
  const { db, index } = useIronLog();
  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);

  const change = summary.weekVolumeChange;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <StatTile
        label="حجم هذا الأسبوع"
        value={formatCompact(summary.weekVolumeKg)}
        unit="كجم"
        delta={
          change === null
            ? null
            : {
                value: `${change >= 0 ? "+" : "−"}${Math.abs(change)}%`,
                direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
                period: "عن الأسبوع الماضي",
              }
        }
        trend={summary.volumeSparkline}
        trendLabel="حجم التمرين في آخر 12 أسبوع"
      />

      <StatTile
        label="أيام التدريب هذا الأسبوع"
        value={`${summary.weekAttended}`}
        unit={`/ ${summary.weeklyGoal}`}
        delta={{
          value:
            summary.weekAttended >= summary.weeklyGoal
              ? "الهدف مكتمل"
              : `باقي ${summary.weeklyGoal - summary.weekAttended}`,
          direction:
            summary.weekAttended >= summary.weeklyGoal ? "up" : "flat",
          period: "",
        }}
      />

      <StatTile
        label="أرقام قياسية (30 يوم)"
        value={`${summary.prsLast30Days}`}
        delta={{
          value: `أطول سلسلة ${summary.longestStreak}`,
          direction: "flat",
          period: "يوم",
        }}
      />

      <StatTile
        label="إجمالي الحجم المرفوع"
        value={formatCompact(summary.totalVolumeKg)}
        unit="كجم"
        delta={{
          value: `${summary.totalSetsLogged}`,
          direction: "flat",
          period: "مجموعة مسجّلة",
        }}
      />
    </div>
  );
}
