"use client";

import { Ruler, Scale } from "lucide-react";
import { useMemo, useState } from "react";

import { ChartShell, type TableColumn } from "@/components/charts/chart-kit";
import { LineAreaChart } from "@/components/charts/line-area-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { bodyChange, bodySeries } from "@/lib/metrics";
import type { BodyPatch } from "@/lib/repository";
import { useIronLog } from "@/lib/store";
import {
  BODY_FIELDS,
  BODY_FIELD_META,
  type BodyField,
  type BodyPoint,
} from "@/lib/types";
import {
  formatNumber,
  formatShortDate,
  isIsoDate,
  toFiniteNumber,
  toIsoDate,
} from "@/lib/utils";

/**
 * Build the patch explicitly rather than with a computed key: a computed key of
 * union type widens to a string index signature, which is not what
 * `setBodyMetric` accepts.
 */
function bodyPatch(key: BodyField, value: number | null): BodyPatch {
  switch (key) {
    case "weightKg":
      return { weightKg: value };
    case "waistCm":
      return { waistCm: value };
    case "chestCm":
      return { chestCm: value };
    case "armCm":
      return { armCm: value };
    case "thighCm":
      return { thighCm: value };
    case "shoulderCm":
      return { shoulderCm: value };
  }
}

const COLUMNS: readonly TableColumn<BodyPoint>[] = [
  { header: "التاريخ", cell: (row) => formatShortDate(row.date) },
  { header: "القياس", align: "end", cell: (row) => formatNumber(row.value) },
  {
    header: "متوسط ٧ أيام",
    align: "end",
    cell: (row) => formatNumber(row.average),
  },
];

/**
 * Body check-ins: the scale, the tape, and what they have done over a month.
 *
 * Writes go straight to the store as you type — the values are clamped in
 * `setBodyMetric`, an emptied field stores `null` rather than zero, and a row
 * where everything was cleared deletes itself instead of leaving a hole in the
 * chart. A weigh-in also updates the bodyweight the rest of the app quotes, so
 * the protein guidance is never computed against a number from last season.
 */
export function BodyPanel() {
  const { db, actions } = useIronLog();
  const today = toIsoDate();
  const [date, setDate] = useState(today);
  const [field, setField] = useState<BodyField>("weightKg");

  const entry = db.bodyMetrics[date];

  const series = useMemo(() => bodySeries(db, field, 60), [db, field]);
  const change = useMemo(() => bodyChange(db, field, 30), [db, field]);

  const points = useMemo(
    () => series.map((point) => ({ label: point.label, value: point.average })),
    [series],
  );

  const [active, setActive] = useState<number | null>(null);
  const shown = active !== null ? series[active] : series[series.length - 1];
  const meta = BODY_FIELD_META[field];

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Scale className="size-4 text-primary" aria-hidden />
            قياس اليوم
          </CardTitle>
          <CardDescription>
            الأرقام تُحفظ فوراً · اترك أي حقل فاضياً إذا ما قِسته — الفاضي ما
            يدخل في أي متوسط
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="body-date">التاريخ</Label>
            <Input
              id="body-date"
              type="date"
              value={date}
              max={today}
              onChange={(event) => {
                if (isIsoDate(event.target.value)) setDate(event.target.value);
              }}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {BODY_FIELDS.map((key) => {
              const fieldMeta = BODY_FIELD_META[key];
              const value = entry?.[key];
              return (
                <div key={key}>
                  <Label htmlFor={`body-${key}`}>
                    {fieldMeta.label} ({fieldMeta.unit})
                  </Label>
                  <Input
                    id={`body-${key}`}
                    type="number"
                    inputMode="decimal"
                    value={value === null || value === undefined ? "" : String(value)}
                    onChange={(event) => {
                      const raw = event.target.value;
                      actions.setBodyMetric(
                        date,
                        bodyPatch(
                          key,
                          raw.trim() === "" ? null : toFiniteNumber(raw),
                        ),
                      );
                    }}
                    placeholder="—"
                    className="mt-1 tnum"
                  />
                </div>
              );
            })}
          </div>

          <div>
            <Label htmlFor="body-note">ملاحظة</Label>
            <Input
              id="body-note"
              value={entry?.note ?? ""}
              onChange={(event) =>
                actions.setBodyMetric(date, { note: event.target.value })
              }
              placeholder="مثال: قياس الصباح على الريق"
              maxLength={240}
              className="mt-1 text-sm font-normal"
            />
          </div>
        </CardContent>
      </Card>

      {series.length < 2 ? (
        <EmptyState
          icon={Ruler}
          title="ما فيه قياسان بعد"
          description="سجّل قياسين على الأقل بتاريخين مختلفين، ويبدأ المنحنى يرتسم مع متوسط سبعة أيام."
        />
      ) : (
        <ChartShell
          title={`${meta.label} — متوسط ٧ أيام`}
          subtitle={
            change === null
              ? `آخر ${series.length} قياس`
              : /* Worded, not signed: a leading "−" inside Arabic text is
                   reordered by the bidi algorithm and renders after the digits. */
                `${
                  change.delta > 0
                    ? "زيادة"
                    : change.delta < 0
                      ? "نزول"
                      : "ثبات"
                } ${formatNumber(Math.abs(change.delta))} ${meta.unit} في ٣٠ يوم`
          }
          readout={
            shown ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                <span className="text-foreground">
                  {formatShortDate(shown.date)}
                </span>
                <span className="tnum text-base font-extrabold text-foreground">
                  {formatNumber(shown.average)}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    {` ${meta.unit}`}
                  </span>
                </span>
                <span className="tnum">
                  القياس نفسه {formatNumber(shown.value)}
                </span>
              </div>
            ) : null
          }
          tableRows={series}
          tableColumns={COLUMNS}
          legend={
            <span>
              المرسوم هو متوسط سبعة أيام، لا قياس اليوم — الوزن يتحرك كيلو كامل
              على الماء والأكل، والمتوسط وحده هو الاتجاه.
            </span>
          }
        >
          <LineAreaChart
            points={points}
            formatTick={(value) => formatNumber(value)}
            endLabel={
              shown ? `${formatNumber(shown.average)} ${meta.unit}` : undefined
            }
            activeIndex={active}
            onActiveChange={setActive}
            ariaLabel={`منحنى ${meta.label} كمتوسط سبعة أيام`}
          />
        </ChartShell>
      )}

      <Card>
        <CardHeader>
          <CardTitle>القياس المعروض</CardTitle>
          <CardDescription>
            بدّل القياس لتشوف منحناه وتغيّره في آخر ٣٠ يوم
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <Select
            aria-label="القياس المعروض"
            value={field}
            onChange={(event) => {
              setField(event.target.value as BodyField);
              setActive(null);
            }}
          >
            {BODY_FIELDS.map((key) => (
              <option key={key} value={key}>
                {BODY_FIELD_META[key].label}
              </option>
            ))}
          </Select>

          <ul className="divide-y divide-border">
            {BODY_FIELDS.map((key) => {
              const rowChange = bodyChange(db, key, 30);
              const fieldMeta = BODY_FIELD_META[key];
              return (
                <li
                  key={key}
                  className="flex items-baseline justify-between py-2 first:pt-1 last:pb-0"
                >
                  <span className="text-[12.5px] font-bold">
                    {fieldMeta.label}
                  </span>
                  <span className="tnum font-mono text-[11.5px]">
                    {rowChange === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>
                        <bdi dir="ltr">{formatNumber(rowChange.to)}</bdi>{" "}
                        <span className="text-muted-foreground">
                          {fieldMeta.unit} ·{" "}
                          {rowChange.delta > 0
                            ? "زيادة"
                            : rowChange.delta < 0
                              ? "نزول"
                              : "ثبات"}{" "}
                          <bdi dir="ltr">
                            {formatNumber(Math.abs(rowChange.delta))}
                          </bdi>{" "}
                          في ٣٠ يوم
                        </span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
