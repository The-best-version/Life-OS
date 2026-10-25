"use client";

import { Activity, Bed, Droplets, Footprints, HeartPulse } from "lucide-react";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Meter } from "@/components/ui/meter";
import { healthAverage, sleepVsVolume, waistToHeight } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { HealthPatch } from "@/lib/repository";
import { HEALTH_FIELD_META, type HealthField } from "@/lib/types";
import { formatNumber, isIsoDate, toFiniteNumber, toIsoDate } from "@/lib/utils";

/**
 * Explicit patch per field, never a computed key.
 *
 * Same reason `macroPatch` exists on the nutrition screen: a computed key of
 * union type widens to a string index signature, which is not what the action
 * accepts.
 */
function healthPatch(field: HealthField, value: number | null): HealthPatch {
  switch (field) {
    case "sleepHours":
      return { sleepHours: value };
    case "steps":
      return { steps: value };
    case "waterMl":
      return { waterMl: value };
    case "restingHr":
      return { restingHr: value };
  }
}

const ICONS: Record<HealthField, typeof Bed> = {
  sleepHours: Bed,
  steps: Footprints,
  waterMl: Droplets,
  restingHr: HeartPulse,
};

/**
 * The health panel: the half of the picture a barbell cannot see.
 *
 * Four readings, chosen because each one moves something the gym cannot — sleep
 * drives recovery and appetite, steps are most of the day's expenditure, water
 * is the cheapest performance variable there is, and a resting pulse is the only
 * conditioning marker here that needs no equipment.
 *
 * The verdict card at the bottom is the point of the screen. Logging a number
 * every night is a chore unless something eventually reads it back and says what
 * it meant — so the panel answers the question the user actually asked: does
 * sleeping more change how he trains?
 */
export function HealthPanel() {
  const { db, index, actions } = useIronLog();
  const today = toIsoDate();
  const [date, setDate] = useState(today);

  const entry = db.health[date];
  const targets = db.settings.healthTargets;

  const sleepVerdict = sleepVsVolume(db, index, targets.sleepHours);
  const ratio = waistToHeight(db, db.settings.heightCm);

  const averages = {
    sleepHours: healthAverage(db, "sleepHours"),
    steps: healthAverage(db, "steps"),
    waterMl: healthAverage(db, "waterMl"),
    restingHr: healthAverage(db, "restingHr"),
  };

  const fields: { key: HealthField; target: number | null }[] = [
    { key: "sleepHours", target: targets.sleepHours },
    { key: "steps", target: targets.steps },
    { key: "waterMl", target: targets.waterMl },
    // A resting pulse has no "target" — lower is better, and a goal line would
    // invite chasing it, which is not something you can do directly.
    { key: "restingHr", target: null },
  ];

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>قياسات اليوم</CardTitle>
          <CardDescription>
            الأرقام تُحفظ فوراً — ما فيه زر حفظ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="health-date">التاريخ</Label>
            <Input
              id="health-date"
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
            {fields.map(({ key }) => {
              const meta = HEALTH_FIELD_META[key];
              const Icon = ICONS[key];
              const value = entry?.[key];
              return (
                <div key={key}>
                  <Label htmlFor={`h-${key}`} className="flex items-center gap-1.5">
                    <Icon className="size-3.5 text-fg-3" aria-hidden />
                    {meta.label}
                  </Label>
                  <Input
                    id={`h-${key}`}
                    type="number"
                    inputMode="decimal"
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    value={value === null || value === undefined ? "" : String(value)}
                    onChange={(event) => {
                      const raw = event.target.value.trim();
                      // An emptied box means "I did not measure this", which is
                      // not the same as zero — it has to clear the field, or a
                      // backspace would record a night of no sleep.
                      actions.setHealth(
                        date,
                        healthPatch(key, raw === "" ? null : toFiniteNumber(raw)),
                      );
                    }}
                    placeholder={meta.unit}
                    className="mt-1 num"
                  />
                </div>
              );
            })}
          </div>

          <div>
            <Label htmlFor="h-bedtime" className="flex items-center gap-1.5">
              <Bed className="size-3.5 text-fg-3" aria-hidden />
              نمت الساعة
            </Label>
            <Input
              id="h-bedtime"
              type="time"
              value={entry?.bedtime ?? ""}
              onChange={(event) =>
                actions.setHealth(date, { bedtime: event.target.value || null })
              }
              className="mt-1 num"
            />
            <p className="mt-1 text-[11px] text-fg-3">
              ساعات النوم تقول كم نمت. هذي تقول متى — والاثنتان تفشلان بشكل مختلف.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>آخر 14 يوم</CardTitle>
          <CardDescription>المتوسط مقابل هدفك اليومي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.filter((field) => field.target !== null).length === 0 ? null : (
            <>
              {fields.map(({ key, target }) => {
                const average = averages[key];
                if (target === null || average === null) return null;
                return (
                  <Meter
                    key={key}
                    label={HEALTH_FIELD_META[key].label}
                    value={average.average}
                    target={target}
                    unit={HEALTH_FIELD_META[key].unit}
                  />
                );
              })}
            </>
          )}

          {averages.restingHr ? (
            <p className="flex items-center gap-1.5 text-xs text-fg-3">
              <HeartPulse className="size-3.5" aria-hidden />
              متوسط نبض الراحة{" "}
              <bdi dir="ltr" className="num font-bold text-fg">
                {formatNumber(averages.restingHr.average)}
              </bdi>{" "}
              ن/د
            </p>
          ) : null}

          {Object.values(averages).every((value) => value === null) ? (
            <p className="text-xs text-fg-3">
              ما فيه قياسات بعد — سجّل نومك الليلة ويبدأ المتوسط يرتسم.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {ratio ? (
        <Card>
          <CardHeader>
            <CardTitle>الخصر إلى الطول</CardTitle>
            <CardDescription>
              المقياس الوحيد هنا وراءه عتبة منشورة: خلّ خصرك تحت نصف طولك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="flex items-baseline gap-2">
              <span
                className="figure text-[30px]"
                style={{
                  color:
                    ratio.band === "good"
                      ? "hsl(var(--success-ink))"
                      : ratio.band === "watch"
                        ? "hsl(var(--caution-ink))"
                        : "hsl(var(--danger-ink))",
                }}
              >
                <bdi dir="ltr">{ratio.ratio.toFixed(2)}</bdi>
              </span>
              <span className="text-xs font-bold text-fg-3">
                {ratio.band === "good"
                  ? "داخل النطاق الصحي"
                  : ratio.band === "watch"
                    ? "فوق النصف — راقبه"
                    : "مرتفع"}
              </span>
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-accent-glow" aria-hidden />
            نومك وأداؤك
          </CardTitle>
          <CardDescription>
            هل النوم فعلاً يغيّر تمرينك؟ الجواب من بياناتك أنت، لا من قاعدة عامة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sleepVerdict === null ? (
            <p className="text-xs leading-relaxed text-fg-3">
              محتاج 4 حصص على الأقل بعد نوم كافٍ، ومثلها بعد نوم أقل، قبل ما
              يطلع حكم. سجّل ساعات نومك كل ليلة وبيجي.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed">
                حصصك بعد نوم{" "}
                <bdi dir="ltr" className="num font-bold">
                  {formatNumber(db.settings.healthTargets.sleepHours)}
                </bdi>{" "}
                ساعات فأكثر متوسط حجمها{" "}
                <span
                  className="font-bold"
                  style={{
                    color:
                      sleepVerdict.deltaPct >= 0
                        ? "hsl(var(--success-ink))"
                        : "hsl(var(--danger-ink))",
                  }}
                >
                  {sleepVerdict.deltaPct >= 0 ? "أعلى" : "أقل"} بـ{" "}
                  <bdi dir="ltr" className="num">
                    {Math.abs(sleepVerdict.deltaPct)}%
                  </bdi>
                </span>{" "}
                من حصصك بعد نوم أقل.
              </p>
              <p className="num text-[11px] text-fg-3">
                <bdi dir="ltr">{formatNumber(sleepVerdict.restedVolume)}</bdi> كجم
                في {sleepVerdict.restedCount} حصة ·{" "}
                <bdi dir="ltr">{formatNumber(sleepVerdict.tiredVolume)}</bdi> كجم
                في {sleepVerdict.tiredCount} حصة
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
