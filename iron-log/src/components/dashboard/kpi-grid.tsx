"use client";

import { CalendarCheck, Dumbbell, Layers, Trophy } from "lucide-react";
import { useMemo } from "react";

import { StatTile } from "@/components/dashboard/stat-tile";
import { dashboardSummary } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { formatCompact } from "@/lib/utils";

/**
 * The four numbers worth seeing before any chart.
 *
 * Each tile takes a different colour from the studio spectrum — tonnage red,
 * attendance cyan, records gold, lifetime violet. The assignment is arbitrary
 * but it is FIXED: the colour is how this grid is scanned, so a tile that
 * changed colour with its value would be unreadable.
 */
export function KpiGrid() {
  const { db, index } = useIronLog();
  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);

  const change = summary.weekVolumeChange;

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      <StatTile
        featured
        tone="red"
        icon={Dumbbell}
        label="حجم هذا الأسبوع"
        value={formatCompact(summary.weekVolumeKg)}
        unit="كجم"
        delta={
          change === null
            ? null
            : {
                // Worded, never signed, and the percentage isolated.
                // A leading "−" in front of digits inside Arabic text is a
                // neutral character: the bidi algorithm moves it to the far
                // side, so "−16%" renders as "16%−" and reads as a gain. The
                // "%" needs the same isolation for the same reason.
                value: (
                  <>
                    {change > 0 ? "زيادة" : change < 0 ? "انخفاض" : "ثبات"}{" "}
                    <bdi dir="ltr">{Math.abs(change)}%</bdi>
                  </>
                ),
                direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
                period: "عن الأسبوع الماضي",
              }
        }
        trend={summary.volumeSparkline}
        trendLabel="حجم التمرين في آخر 12 أسبوع"
      />

      <StatTile
        tone="cyan"
        icon={CalendarCheck}
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
        tone="gold"
        icon={Trophy}
        label="أرقام قياسية (30 يوم)"
        value={`${summary.prsLast30Days}`}
        delta={{
          value: `أطول سلسلة ${summary.longestStreak}`,
          direction: "flat",
          period: "يوم",
        }}
      />

      <StatTile
        tone="violet"
        icon={Layers}
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
