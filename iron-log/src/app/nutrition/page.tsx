"use client";

import { Apple, Calendar, HeartPulse, Ruler, Scale, Sparkles } from "lucide-react";
import { useState } from "react";

import { BodyPanel } from "@/components/body/body-panel";
import { HealthPanel } from "@/components/body/health-panel";
import { proteinBand } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { NutritionLog } from "@/lib/types";
import { cn, formatFullDate, formatNumber, isIsoDate, toFiniteNumber, toIsoDate } from "@/lib/utils";

type MacroKey = "kcal" | "protein" | "carbs" | "fat";

function macroPatch(key: MacroKey, value: number): Partial<Omit<NutritionLog, "date">> {
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

const MACROS: { key: MacroKey; label: string; unit: string }[] = [
  { key: "kcal", label: "السعرات", unit: "سعرة" },
  { key: "protein", label: "البروتين", unit: "جم" },
  { key: "carbs", label: "الكاربوهيدرات", unit: "جم" },
  { key: "fat", label: "الدهون", unit: "جم" },
];

const TABS = [
  { id: "food", label: "الماكروز والتغذية", icon: Apple },
  { id: "body", label: "قياسات الجسم", icon: Ruler },
  { id: "health", label: "المؤشرات", icon: HeartPulse },
] as const;

export default function NutritionPage() {
  const { db, actions } = useIronLog();
  const today = toIsoDate();
  const [date, setDate] = useState(today);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("food");

  const entry = db.nutrition[date];
  const targets = db.settings.targets;
  const proteinGuidance = proteinBand(db.settings.bodyWeightKg);

  return (
    <div className="space-y-4 pt-1 animate-fade-in">
      <section className="plate p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 border-b border-line pb-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-line-strong bg-surface-2 text-fg-2">
              <Apple className="size-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-fg">الجسم والتغذية</h1>
              <p className="text-xs text-fg-3">{formatFullDate(date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface-2 px-3.5 py-2">
            <Scale className="size-4 text-fg-3" />
            <div className="text-end">
              <span className="block text-[10px] font-bold leading-none text-fg-3">الوزن الحالي</span>
              <span className="num mt-0.5 block text-sm font-semibold leading-tight text-fg">
                {db.settings.bodyWeightKg ? (
                  <>
                    {formatNumber(db.settings.bodyWeightKg)}{" "}
                    <span className="text-xs font-normal text-fg-3">كجم</span>
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-fg-3">
            <Calendar className="size-3.5" />
            <span>عرض يوم:</span>
          </div>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              if (isIsoDate(e.target.value)) setDate(e.target.value);
            }}
            className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-xs font-bold text-fg focus:outline-none"
          />
        </div>
      </section>

      <div className="flex items-center gap-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors",
              tab === id
                ? "bg-accent text-white"
                : "border border-line-strong bg-surface-2 text-fg-3 hover:text-fg",
            )}
          >
            <Icon className="size-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === "food" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MACROS.map((m) => {
              const currentVal = entry ? entry[m.key] : 0;
              const target = targets[m.key];
              const ratio = target > 0 ? Math.min(1.2, currentVal / target) : 0;
              const pct = Math.round(ratio * 100);
              const met = target > 0 && currentVal >= target;
              const tone = met ? "text-success" : "text-accent-glow";

              return (
                <div key={m.key} className="plate space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-fg-3">{m.label}</span>
                      <div className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="num text-xl font-semibold text-fg">
                          {formatNumber(currentVal)}
                        </span>
                        <span className="text-[11px] font-medium text-fg-3">
                          / {formatNumber(target)} {m.unit}
                        </span>
                      </div>
                    </div>
                    <span className={cn("num rounded-full border border-line-strong bg-surface-2 px-2.5 py-1 text-xs font-bold", tone)}>
                      {pct}%
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={cn("h-full rounded-full", met ? "bg-success" : "bg-accent")}
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold text-fg-3">سجل:</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={entry ? String(entry[m.key] || "") : ""}
                      onChange={(e) => {
                        const val = toFiniteNumber(e.target.value) ?? 0;
                        actions.setNutrition(date, macroPatch(m.key, val));
                      }}
                      placeholder="0"
                      className="w-full rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-center text-xs font-bold text-fg focus:border-accent/50 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {proteinGuidance ? (
            <div className="plate flex items-center gap-3 p-3.5">
              <Sparkles className="size-4 shrink-0 text-fg-3" />
              <p className="text-xs text-fg-2">
                النطاق اليومي المثالي للبروتين لبناء العضل على وزنك الحالي:{" "}
                <span className="num font-bold text-fg">
                  {proteinGuidance.min}–{proteinGuidance.max} جم
                </span>
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "body" ? <BodyPanel /> : null}
      {tab === "health" ? <HealthPanel /> : null}
    </div>
  );
}
