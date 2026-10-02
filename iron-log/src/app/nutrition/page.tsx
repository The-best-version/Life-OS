"use client";

import { useMemo, useState } from "react";

import { BodyPanel } from "@/components/body/body-panel";
import { HealthPanel } from "@/components/body/health-panel";
import { PageHero } from "@/components/layout/page-hero";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { proteinBand } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { NutritionLog } from "@/lib/types";
import {
  addDays,
  formatFullDate,
  formatNumber,
  formatWeekday,
  isIsoDate,
  toFiniteNumber,
  toIsoDate,
} from "@/lib/utils";

type MacroKey = "kcal" | "protein" | "carbs" | "fat";

/**
 * Build the patch explicitly rather than with a computed key — a computed key of
 * union type widens to a string index signature, which is not what
 * `setNutrition` accepts.
 */
function macroPatch(
  key: MacroKey,
  value: number,
): Partial<Omit<NutritionLog, "date">> {
  switch (key) {
    case "kcal":
      return { kcal: value };
    case "protein":
      return { protein: value };
    case "carbs":
      return { carbs: value };
    case "fat":
      return { fat: value };
  }
}

/**
 * The body screen: what went in, and what the body did about it.
 *
 * Food and measurements share one screen because they are one feedback loop —
 * a protein target is meaningless without the bodyweight it is computed from,
 * and a stalled scale is a question about the kitchen, not the gym. They are
 * separate tabs rather than one long page so neither buries the other.
 */
export default function BodyScreen() {
  const { db, actions } = useIronLog();
  const today = toIsoDate();
  const [date, setDate] = useState(today);

  const entry = db.nutrition[date];
  const targets = db.settings.targets;
  const protein = proteinBand(db.settings.bodyWeightKg);

  const week = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, offset) => {
      const iso = toIsoDate(addDays(base, offset - 6));
      return { iso, log: db.nutrition[iso] };
    });
  }, [db.nutrition]);

  const fields: { key: MacroKey; label: string; target: number }[] = [
    { key: "kcal", label: "السعرات", target: targets.kcal },
    { key: "protein", label: "بروتين (جم)", target: targets.protein },
    { key: "carbs", label: "كارب (جم)", target: targets.carbs },
    { key: "fat", label: "دهون (جم)", target: targets.fat },
  ];

  return (
    <div className="space-y-3 pb-6">
      <PageHero
        eyebrow="الجسم"
        title={formatFullDate(date)}
        subtitle={
          db.settings.bodyWeightKg !== null ? (
            <span className="font-mono">
              آخر وزن مسجّل{" "}
              <span className="font-bold text-foreground">
                <bdi dir="ltr">{formatNumber(db.settings.bodyWeightKg)}</bdi> كجم
              </span>
            </span>
          ) : (
            "الأكل والقياسات حلقة واحدة — هدف البروتين بلا وزن مسجّل مجرد رقم"
          )
        }
      />

      <Tabs defaultValue="food" dir="rtl">
        <TabsList aria-label="أقسام الجسم">
          <TabsTrigger value="food">التغذية</TabsTrigger>
          <TabsTrigger value="body">القياسات</TabsTrigger>
          <TabsTrigger value="health">الصحة</TabsTrigger>
        </TabsList>

        <TabsContent value="food" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>سجل اليوم</CardTitle>
              <CardDescription>
                الأرقام تُحفظ فوراً — ما فيه زر حفظ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="nutrition-date">التاريخ</Label>
                <Input
                  id="nutrition-date"
                  type="date"
                  value={date}
                  max={today}
                  onChange={(event) => {
                    if (isIsoDate(event.target.value)) {
                      setDate(event.target.value);
                    }
                  }}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {fields.map((field) => (
                  <div key={field.key}>
                    <Label htmlFor={`n-${field.key}`}>{field.label}</Label>
                    <Input
                      id={`n-${field.key}`}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={entry ? String(entry[field.key]) : ""}
                      onChange={(event) => {
                        const value = toFiniteNumber(event.target.value) ?? 0;
                        actions.setNutrition(date, macroPatch(field.key, value));
                      }}
                      placeholder="0"
                      className="mt-1 tnum"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>مقابل الأهداف</CardTitle>
              <CardDescription>عدّل الأهداف من صفحة الإعدادات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field) => (
                <Meter
                  key={field.key}
                  label={field.label}
                  value={entry?.[field.key] ?? 0}
                  target={field.target}
                />
              ))}

              {/* Guidance, not a second target: the number the meter measures
                  against stays the one in Settings. */}
              {protein ? (
                <p className="border-t border-border pt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  على وزنك الحالي، نطاق البروتين لبناء العضل{" "}
                  <span className="font-extrabold text-foreground">
                    <bdi dir="ltr">
                      {protein.min}–{protein.max}
                    </bdi>{" "}
                    جم
                  </span>{" "}
                  في اليوم (١٫٨–٢٫٢ جم لكل كيلو).
                  {db.settings.targets.protein < protein.min
                    ? " هدفك الحالي أقل من النطاق."
                    : db.settings.targets.protein > protein.max
                      ? " هدفك الحالي أعلى من النطاق — الزيادة ما تضر لكن ما تضيف."
                      : " هدفك الحالي داخل النطاق."}
                </p>
              ) : (
                <p className="border-t border-border pt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                  سجّل وزنك في تبويب «القياسات» ويطلع لك نطاق البروتين المناسب
                  لوزنك.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>آخر ٧ أيام</CardTitle>
              <CardDescription>السعرات المسجّلة لكل يوم</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {week.map(({ iso, log }) => (
                  <li
                    key={iso}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                  >
                    <span className="text-[12.5px] font-bold">
                      {formatWeekday(iso)}
                      <span className="ms-2 font-mono text-[11px] font-normal text-muted-foreground">
                        {iso}
                      </span>
                    </span>
                    <span className="tnum font-mono text-[12.5px]">
                      {log ? (
                        <>
                          {formatNumber(log.kcal)}
                          <span className="text-muted-foreground">
                            {" / "}
                            {formatNumber(targets.kcal)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health">
          <HealthPanel />
        </TabsContent>

        <TabsContent value="body">
          <BodyPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
