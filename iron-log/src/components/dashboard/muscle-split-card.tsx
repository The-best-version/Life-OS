"use client";

import { PieChart } from "lucide-react";
import { useMemo } from "react";

import { BarList } from "@/components/charts/bar-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { muscleGroupVolume } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { formatCompact } from "@/lib/utils";

/**
 * Where the last four weeks of work actually went.
 *
 * Deliberately a ranked bar list rather than a pie: comparing lengths against a
 * shared baseline is accurate, comparing pie slice angles is not — and the
 * question here ("is my chest getting triple what my hamstrings get?") is exactly
 * the comparison a pie makes hardest.
 */
export function MuscleSplitCard() {
  const { db, index } = useIronLog();

  const rows = useMemo(() => muscleGroupVolume(db, index, 28), [db, index]);

  const barRows = useMemo(
    () =>
      rows.map((row) => ({
        key: row.group,
        label: row.label,
        value: row.volumeKg,
        display: `${formatCompact(row.volumeKg)} كجم`,
        // The share is isolated as its own LTR run; left inside the Arabic
        // sentence the bidi algorithm renders "28%" as "%28".
        note: (
          <>
            {row.setCount} مجموعة ·{" "}
            <bdi dir="ltr">{Math.round(row.share * 100)}%</bdi>
          </>
        ),
      })),
    [rows],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>توزيع الحجم على العضلات</CardTitle>
        <CardDescription>آخر 28 يوم · مرتّب من الأعلى حجماً</CardDescription>
      </CardHeader>
      <CardContent>
        {barRows.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="ما فيه حجم مسجّل في آخر 28 يوم"
            description="أول ما تسجّل مجموعات، يطلع لك هنا أي عضلة تأخذ نصيبها وأي عضلة مهملة."
            className="border-0 py-6"
          />
        ) : (
          <BarList rows={barRows} />
        )}
      </CardContent>
    </Card>
  );
}
