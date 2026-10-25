"use client";

import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageHero } from "@/components/layout/page-hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { importBackupText } from "@/lib/legacy-import";
import { useIronLog } from "@/lib/store";
import type { WeightUnit } from "@/lib/types";
import { clamp, toFiniteNumber, toIsoDate } from "@/lib/utils";

/**
 * A labelled switch row.
 *
 * Boolean preferences write straight through — there is nothing to validate and
 * nothing to lose, so making the user press save for a toggle would only add a
 * way to forget.
 */
function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-[11.5px] normal-case tracking-normal">
          {label}
        </Label>
        {hint ? (
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-fg-3">
            {hint}
          </p>
        ) : null}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="mt-0.5 shrink-0"
      />
    </div>
  );
}

/** A destructive action gated behind a second tap, with a 3s cool-off. */
function useArmedAction(timeoutMs = 3000) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function arm() {
    setArmed(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(false), timeoutMs);
  }

  function disarm() {
    setArmed(false);
    if (timer.current) clearTimeout(timer.current);
  }

  return { armed, arm, disarm };
}

export default function SettingsPage() {
  const { db, actions } = useIronLog();
  const toast = useToast();

  // Numeric preferences are edited as drafts: binding them straight to the store
  // would rewrite the value on every keystroke and fight the user's cursor.
  const [weeklyGoal, setWeeklyGoal] = useState(String(db.settings.weeklyGoal));
  const [bodyWeight, setBodyWeight] = useState(
    db.settings.bodyWeightKg === null ? "" : String(db.settings.bodyWeightKg),
  );
  const [restSeconds, setRestSeconds] = useState(
    String(db.settings.restSeconds),
  );
  const [repMin, setRepMin] = useState(String(db.settings.repMin));
  const [repMax, setRepMax] = useState(String(db.settings.repMax));
  const [increment, setIncrement] = useState(String(db.settings.incrementKg));
  const [kcal, setKcal] = useState(String(db.settings.targets.kcal));
  const [protein, setProtein] = useState(String(db.settings.targets.protein));
  const [carbs, setCarbs] = useState(String(db.settings.targets.carbs));
  const [fat, setFat] = useState(String(db.settings.targets.fat));
  const [heightCm, setHeightCm] = useState(
    db.settings.heightCm === null ? "" : String(db.settings.heightCm),
  );
  const [sleepTarget, setSleepTarget] = useState(
    String(db.settings.healthTargets.sleepHours),
  );
  const [stepsTarget, setStepsTarget] = useState(
    String(db.settings.healthTargets.steps),
  );
  const [waterTarget, setWaterTarget] = useState(
    String(db.settings.healthTargets.waterMl),
  );

  const fileInput = useRef<HTMLInputElement | null>(null);
  const resetHistory = useArmedAction();
  const resetAll = useArmedAction();

  function handleSavePreferences() {
    const goal = toFiniteNumber(weeklyGoal);
    const weight = toFiniteNumber(bodyWeight);
    const height = toFiniteNumber(heightCm);

    // The rep window is saved as a window, not two independent numbers: a max
    // below the min would make double progression ask for a target it can never
    // reach, so the max is floored at the min rather than rejected.
    const nextRepMin = clamp(
      Math.round(toFiniteNumber(repMin) ?? db.settings.repMin),
      1,
      30,
    );
    const nextRepMax = clamp(
      Math.round(toFiniteNumber(repMax) ?? db.settings.repMax),
      nextRepMin,
      50,
    );

    actions.updateSettings({
      weeklyGoal: goal === null ? db.settings.weeklyGoal : clamp(Math.round(goal), 1, 7),
      bodyWeightKg: bodyWeight.trim() === "" || weight === null ? null : weight,
      /* Blank clears it rather than falling back to the stored value: an empty
         height is a real state (it just hides the waist ratio), and a field you
         cannot empty is a field that lies after the first mistyped number. */
      heightCm: heightCm.trim() === "" || height === null ? null : height,
      healthTargets: {
        sleepHours: clamp(
          toFiniteNumber(sleepTarget) ?? db.settings.healthTargets.sleepHours,
          4,
          12,
        ),
        steps: clamp(
          Math.round(toFiniteNumber(stepsTarget) ?? db.settings.healthTargets.steps),
          1_000,
          50_000,
        ),
        waterMl: clamp(
          Math.round(toFiniteNumber(waterTarget) ?? db.settings.healthTargets.waterMl),
          500,
          8_000,
        ),
      },
      restSeconds: clamp(
        Math.round(toFiniteNumber(restSeconds) ?? db.settings.restSeconds),
        15,
        600,
      ),
      repMin: nextRepMin,
      repMax: nextRepMax,
      incrementKg: clamp(
        toFiniteNumber(increment) ?? db.settings.incrementKg,
        0.5,
        50,
      ),
      targets: {
        kcal: Math.max(0, Math.round(toFiniteNumber(kcal) ?? db.settings.targets.kcal)),
        protein: Math.max(
          0,
          Math.round(toFiniteNumber(protein) ?? db.settings.targets.protein),
        ),
        carbs: Math.max(
          0,
          Math.round(toFiniteNumber(carbs) ?? db.settings.targets.carbs),
        ),
        fat: Math.max(0, Math.round(toFiniteNumber(fat) ?? db.settings.targets.fat)),
      },
    });

    toast.success("انحفظت الإعدادات");
  }

  function handleExport() {
    try {
      const blob = new Blob([actions.exportJson()], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `iron-log-backup-${toIsoDate()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      // Revoke on the next tick so the download has definitely started.
      setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success("تم تجهيز النسخة الاحتياطية");
    } catch {
      toast.error("ما قدرنا نصدّر الملف");
    }
  }

  async function handleImport(file: File) {
    try {
      const text = await file.text();
      const outcome = importBackupText(text);

      if ("error" in outcome) {
        toast.error(outcome.error);
        return;
      }

      actions.replaceDatabase(outcome.db);
      toast.success(
        `تم الاستيراد: ${outcome.report.setsImported} مجموعة · ${outcome.report.daysImported} يوم`,
      );
      if (outcome.report.setsSkipped > 0) {
        toast.toast(
          `تم تجاهل ${outcome.report.setsSkipped} سجل غير صالح`,
        );
      }
    } catch {
      toast.error("ما قدرنا نقرأ الملف");
    }
  }

  return (
    <div className="space-y-3 pb-6">
      <PageHero
        eyebrow="Iron Log"
        title="الإعدادات"
        subtitle="القواعد العامة للتدريب والراحة والتغذية، ونسخك الاحتياطية"
      />

      <Card>
        <CardHeader>
          <CardTitle>التدريب</CardTitle>
          <CardDescription>
            الهدف الأسبوعي يظهر كخط الهدف في رسم الالتزام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor="weekly-goal">أيام التدريب في الأسبوع</Label>
              <Input
                id="weekly-goal"
                type="number"
                inputMode="numeric"
                min="1"
                max="7"
                value={weeklyGoal}
                onChange={(event) => setWeeklyGoal(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="body-weight">وزن الجسم (كجم)</Label>
              <Input
                id="body-weight"
                type="number"
                inputMode="decimal"
                min="20"
                max="400"
                step="0.1"
                value={bodyWeight}
                onChange={(event) => setBodyWeight(event.target.value)}
                placeholder="اختياري"
                className="mt-1 num"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="unit">وحدة عرض الأوزان</Label>
            <Select
              id="unit"
              value={db.settings.unit}
              onChange={(event) =>
                actions.updateSettings({
                  unit: event.target.value as WeightUnit,
                })
              }
              className="mt-1"
            >
              <option value="kg">كيلوجرام (كجم)</option>
              <option value="lb">رطل (lb)</option>
            </Select>
            <p className="mt-1.5 text-[11px] leading-relaxed text-fg-3">
              التخزين دائماً بالكيلوجرام — الوحدة للعرض فقط، فتغييرها لا يمسّ سجلك.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الراحة والتقدم</CardTitle>
          <CardDescription>
            هذه هي القواعد العامة. أي تمرين يقدر يخالفها من زر الإعداد في بطاقته
            — والحقل الفاضي هناك يعني «اتبع هذه القيم».
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor="rest-seconds">الراحة بين المجموعات (ثانية)</Label>
              <Input
                id="rest-seconds"
                type="number"
                inputMode="numeric"
                value={restSeconds}
                onChange={(event) => setRestSeconds(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="increment">خطوة الوزن (كجم)</Label>
              <Input
                id="increment"
                type="number"
                inputMode="decimal"
                value={increment}
                onChange={(event) => setIncrement(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="rep-min">أقل تكرارات في المدى</Label>
              <Input
                id="rep-min"
                type="number"
                inputMode="numeric"
                value={repMin}
                onChange={(event) => setRepMin(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="rep-max">أكثر تكرارات في المدى</Label>
              <Input
                id="rep-max"
                type="number"
                inputMode="numeric"
                value={repMax}
                onChange={(event) => setRepMax(event.target.value)}
                className="mt-1 num"
              />
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-fg-3">
            التقدم المزدوج: تثبت على نفس الوزن حتى تكمل{" "}
            <bdi dir="ltr">{db.settings.repMax}</bdi> تكرار في كل مجموعة، بعدها
            تزيد خطوة وزن واحدة وترجع إلى{" "}
            <bdi dir="ltr">{db.settings.repMin}</bdi>. هذا هو ما يحسب «هدف اليوم»
            في كل بطاقة تمرين.
          </p>

          <div className="space-y-2.5 border-t border-line-strong pt-3">
            <ToggleRow
              id="rest-auto"
              label="ابدأ المؤقّت تلقائياً بعد كل مجموعة"
              hint="مجموعة التسخين لا تشغّله — تدخل منها للمجموعة الفعلية مباشرة."
              checked={db.settings.restAutoStart}
              onChange={(value) =>
                actions.updateSettings({ restAutoStart: value })
              }
            />
            <ToggleRow
              id="rest-sound"
              label="نغمة عند انتهاء الراحة"
              checked={db.settings.restSound}
              onChange={(value) => actions.updateSettings({ restSound: value })}
            />
            <ToggleRow
              id="rest-vibrate"
              label="اهتزاز عند انتهاء الراحة"
              hint="سفاري على iPhone ما يدعم الاهتزاز — النغمة تكفي هناك."
              checked={db.settings.restVibrate}
              onChange={(value) =>
                actions.updateSettings({ restVibrate: value })
              }
            />
          </div>

          {/* The switches write immediately; the numbers above are drafts, so
              they need a commit. One button saves every draft on this screen. */}
          <Button onClick={handleSavePreferences} className="w-full">
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أهداف الصحة اليومية</CardTitle>
          <CardDescription>
            الطول يُستخدم لحساب نسبة الخصر إلى الطول فقط
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor="t-height">الطول (سم)</Label>
              <Input
                id="t-height"
                type="number"
                inputMode="decimal"
                min="100"
                max="250"
                value={heightCm}
                onChange={(event) => setHeightCm(event.target.value)}
                placeholder="ما سجّلت"
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="t-sleep">هدف النوم (ساعة)</Label>
              <Input
                id="t-sleep"
                type="number"
                inputMode="decimal"
                min="4"
                max="12"
                step="0.5"
                value={sleepTarget}
                onChange={(event) => setSleepTarget(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="t-steps">هدف الخطوات</Label>
              <Input
                id="t-steps"
                type="number"
                inputMode="numeric"
                min="1000"
                max="50000"
                step="500"
                value={stepsTarget}
                onChange={(event) => setStepsTarget(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="t-water">هدف الماء (مل)</Label>
              <Input
                id="t-water"
                type="number"
                inputMode="numeric"
                min="500"
                max="8000"
                step="250"
                value={waterTarget}
                onChange={(event) => setWaterTarget(event.target.value)}
                className="mt-1 num"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أهداف التغذية اليومية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label htmlFor="t-kcal">سعرات</Label>
              <Input
                id="t-kcal"
                type="number"
                inputMode="numeric"
                min="0"
                value={kcal}
                onChange={(event) => setKcal(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="t-protein">بروتين (جم)</Label>
              <Input
                id="t-protein"
                type="number"
                inputMode="numeric"
                min="0"
                value={protein}
                onChange={(event) => setProtein(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="t-carbs">كارب (جم)</Label>
              <Input
                id="t-carbs"
                type="number"
                inputMode="numeric"
                min="0"
                value={carbs}
                onChange={(event) => setCarbs(event.target.value)}
                className="mt-1 num"
              />
            </div>
            <div>
              <Label htmlFor="t-fat">دهون (جم)</Label>
              <Input
                id="t-fat"
                type="number"
                inputMode="numeric"
                min="0"
                value={fat}
                onChange={(event) => setFat(event.target.value)}
                className="mt-1 num"
              />
            </div>
          </div>

          <Button onClick={handleSavePreferences} className="mt-3 w-full">
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>النسخ الاحتياطي</CardTitle>
          <CardDescription>
            كل شيء محفوظ في هذا المتصفح فقط. صدّر نسخة قبل تفريغ بيانات المتصفح أو
            تغيير الجهاز.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="secondary" onClick={handleExport} className="w-full">
            <Download className="size-4" aria-hidden />
            تصدير نسخة احتياطية (JSON)
          </Button>

          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Reset the input so re-picking the same file fires onChange again.
              event.target.value = "";
              if (file) void handleImport(file);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => fileInput.current?.click()}
            className="w-full"
          >
            <Upload className="size-4" aria-hidden />
            استيراد نسخة (يستبدل البيانات الحالية)
          </Button>
          <p className="text-[11px] leading-relaxed text-fg-3">
            يقبل نسخ Iron Log، ونسخ التطبيق القديم ذو الملف الواحد — يحوّل سجلاته
            تلقائياً إلى المخطط الجديد.
          </p>
        </CardContent>
      </Card>

      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle className="text-accent-glow">منطقة الخطر</CardTitle>
          <CardDescription>
            لا يمكن الرجوع عن هذه الإجراءات. صدّر نسخة احتياطية أولاً.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (!resetHistory.armed) {
                resetHistory.arm();
                return;
              }
              resetHistory.disarm();
              actions.clearHistory();
              toast.toast("تم حذف السجل — البرنامج والإعدادات باقية");
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            {resetHistory.armed
              ? "اضغط مرة ثانية للتأكيد"
              : "حذف السجل (يبقي البرنامج)"}
          </Button>

          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              if (!resetAll.armed) {
                resetAll.arm();
                return;
              }
              resetAll.disarm();
              actions.resetEverything();
              toast.toast("رجعنا كل شيء للبرنامج الافتراضي");
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            {resetAll.armed
              ? "اضغط مرة ثانية للتأكيد"
              : "تصفير كامل (البرنامج الافتراضي)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
