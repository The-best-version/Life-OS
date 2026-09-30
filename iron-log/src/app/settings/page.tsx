"use client";

import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
import { useToast } from "@/components/ui/toast";
import { importBackupText } from "@/lib/legacy-import";
import { useIronLog } from "@/lib/store";
import type { WeightUnit } from "@/lib/types";
import { clamp, toFiniteNumber, toIsoDate } from "@/lib/utils";

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
  const [kcal, setKcal] = useState(String(db.settings.targets.kcal));
  const [protein, setProtein] = useState(String(db.settings.targets.protein));
  const [carbs, setCarbs] = useState(String(db.settings.targets.carbs));
  const [fat, setFat] = useState(String(db.settings.targets.fat));

  const fileInput = useRef<HTMLInputElement | null>(null);
  const resetHistory = useArmedAction();
  const resetAll = useArmedAction();

  function handleSavePreferences() {
    const goal = toFiniteNumber(weeklyGoal);
    const weight = toFiniteNumber(bodyWeight);

    actions.updateSettings({
      weeklyGoal: goal === null ? db.settings.weeklyGoal : clamp(Math.round(goal), 1, 7),
      bodyWeightKg: bodyWeight.trim() === "" || weight === null ? null : weight,
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
      <section className="relative iron-ember overflow-hidden py-5">
        <p className="font-mono text-[11px] text-muted-foreground">الإعدادات</p>
        <h1 className="mt-1 text-[34px] font-black leading-none animate-rise-in">
          الإعدادات
        </h1>
      </section>

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
                className="mt-1 tnum"
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
                className="mt-1 tnum"
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
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              التخزين دائماً بالكيلوجرام — الوحدة للعرض فقط، فتغييرها لا يمسّ سجلك.
            </p>
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
                className="mt-1 tnum"
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
                className="mt-1 tnum"
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
                className="mt-1 tnum"
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
                className="mt-1 tnum"
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
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            يقبل نسخ Iron Log، ونسخ التطبيق القديم ذو الملف الواحد — يحوّل سجلاته
            تلقائياً إلى المخطط الجديد.
          </p>
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">منطقة الخطر</CardTitle>
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
