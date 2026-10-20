"use client";

import { CheckCircle2, ChevronLeft, Flame, Sparkles, Timer, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/metrics";
import { formatNumber } from "@/lib/utils";

/**
 * The elevated Studio Hero command card.
 *
 * Designed with a deep midnight-titanium gradient, ambient neon glows,
 * live workout readiness status, streak tracker, and circular weekly goal ring.
 */
export function StudioHero({ summary }: { summary: DashboardSummary }) {
  const started = summary.streak > 0 || summary.totalSessions > 0;
  const goal = Math.max(1, summary.weeklyGoal);
  const progress = Math.min(1, summary.weekAttended / goal);
  const trainedToday = summary.todaySets > 0;

  return (
    <Card className="relative isolate overflow-hidden rounded-3xl border border-white/[0.12] bg-gradient-to-br from-[#161D2E] via-[#0F1523] to-[#0A0D15] p-5 sm:p-6 text-white shadow-2xl transition-all">
      {/* Dynamic atmospheric radial glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-primary/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 -z-10 size-72 rounded-full bg-cyan-500/15 blur-3xl"
      />

      <Barbell />

      {/* Top Status Bar: Day status and Streak Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[12px] font-black tracking-wide text-white/90">
            {trainedToday
              ? "✅ حصة اليوم مكتملة بنجاح"
              : started
                ? "جاهز لحصة اليوم؟"
                : "أول خطوة في رحلتك الرياضية"}
          </p>
        </div>

        {trainedToday ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-[11px] font-bold text-emerald-300 shadow-sm backdrop-blur-md">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span>{summary.todaySets} مجموعات مُنجزة</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-0.5 text-[11px] font-bold text-white/90 backdrop-blur-md">
            <Sparkles className="size-3 text-amber-300" />
            <span>الهدف: {summary.weeklyGoal} حصص أسبوعياً</span>
          </span>
        )}
      </div>

      {/* Main Stats: Streak figure & Circular Goal Ring */}
      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {started ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className="animate-fade-in block"
                  style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.5))" }}
                >
                  <span className="figure block text-[58px] sm:text-[68px] font-black leading-[0.82] tracking-tight text-white">
                    {summary.streak}
                  </span>
                </span>
                <div className="flex flex-col">
                  <span className="text-[16px] font-black text-white/90">أيام</span>
                  <span className="text-[11px] font-bold text-white/60">متتالية</span>
                </div>
                {summary.streak > 0 ? (
                  <span className="flex size-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/20 shadow-[0_0_15px_rgba(255,42,85,0.35)] backdrop-blur-sm">
                    <Flame className="size-5 text-primary animate-pulse" aria-hidden />
                  </span>
                ) : null}
              </div>

              <p className="mt-3 text-[12.5px] font-medium leading-relaxed text-slate-300">
                {summary.streak > 0
                  ? `أطول سلسلة حققتها ${summary.longestStreak} يوماً · ${summary.totalSessions} حصة مسجّلة بالإجمال`
                  : started
                    ? `${summary.totalSessions} حصة مسجّلة · تمرّن اليوم وأشعل السلسلة مجدداً 🔥`
                    : "سجّل أول مجموعة، ومن بعدها كل رقم في التطبيق يبدأ بالتحرك معك."}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[25px] font-black leading-tight text-white drop-shadow-md">
                الحديد ما يرفع نفسه.
              </p>
              <p className="mt-2 text-[13px] text-slate-300">
                سجّل أول مجموعة اليوم لتبدأ منحنيات تقدمك وأرقامك القياسية.
              </p>
            </div>
          )}
        </div>

        {started ? (
          <GoalRing
            progress={progress}
            attended={summary.weekAttended}
            goal={goal}
          />
        ) : null}
      </div>

      {/* Quick Status Chips & Action Button */}
      {started ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <Chip
              icon={<TrendingUp className="size-3.5 text-cyan-400" aria-hidden />}
              label="حجم الأسبوع"
              value={`${formatNumber(summary.weekVolumeKg)} كجم`}
            />
            {summary.typicalSessionMin !== null ? (
              <Chip
                icon={<Timer className="size-3.5 text-amber-400" aria-hidden />}
                label="متوسط الحصة"
                value={`${summary.typicalSessionMin} دقيقة`}
              />
            ) : null}
            {summary.weightChange30d !== null ? (
              <Chip
                label="الوزن / 30 يوم"
                value={`${
                  summary.weightChange30d > 0
                    ? "زيادة"
                    : summary.weightChange30d < 0
                      ? "نزول"
                      : "ثبات"
                } ${formatNumber(Math.abs(summary.weightChange30d))} كجم`}
              />
            ) : null}
          </div>

          <Link
            href="/workout"
            className="group mr-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#C2002E] px-4 py-2 text-[12.5px] font-black text-white shadow-[0_0_20px_rgba(255,42,85,0.4)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_26px_rgba(255,42,85,0.65)] active:scale-95"
          >
            <span>{trainedToday ? "إضافة تمارين للحصة" : "بدء تمرين الآن"}</span>
            <ChevronLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        </div>
      ) : (
        <Link
          href="/workout"
          className="press mt-5 flex min-h-tap w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary to-[#C2002E] px-6 py-3 text-[15px] font-black text-white shadow-[0_0_25px_rgba(255,42,85,0.45)] transition-all hover:scale-[1.02] sm:w-auto"
        >
          ابدأ تمرين اليوم 🚀
        </Link>
      )}
    </Card>
  );
}

/**
 * Weekly goal progress ring with circular SVG gauge.
 */
function GoalRing({
  progress,
  attended,
  goal,
}: {
  progress: number;
  attended: number;
  goal: number;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const isGoalMet = attended >= goal;

  return (
    <div className="relative shrink-0">
      <svg
        viewBox="0 0 84 84"
        width="86"
        height="86"
        style={{ width: 86, height: 86, minWidth: 86, maxWidth: 86 }}
        className="size-[86px] drop-shadow-[0_0_12px_rgba(0,0,0,0.5)]"
        role="img"
        aria-label={`أيام التدريب هذا الأسبوع ${attended} من ${goal}`}
      >
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="7"
        />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke={isGoalMet ? "#10B981" : "#FF2D55"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 42 42)"
          className="transition-[stroke-dashoffset] duration-700"
          style={{
            filter: isGoalMet
              ? "drop-shadow(0 0 8px rgba(16,185,129,0.7))"
              : "drop-shadow(0 0 8px rgba(255,45,85,0.7))",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="figure text-[19px] font-black text-white leading-none" dir="ltr">
          {attended}/{goal}
        </span>
        <span className="mt-1 text-[9px] font-bold text-slate-300">
          {isGoalMet ? "اكتمل الهدف" : "هذا الأسبوع"}
        </span>
      </div>
    </div>
  );
}

function Chip({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-slate-200 backdrop-blur-md">
      {icon}
      <span>{label}</span>
      <span className="tnum font-black text-white mr-0.5">{value}</span>
    </span>
  );
}

function Barbell() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 -bottom-2 -z-10 h-14 w-full opacity-[0.06]"
    >
      <g fill="#FFFFFF">
        <rect x="70" y="27" width="260" height="6" rx="3" />
        <rect x="88" y="21" width="9" height="18" rx="2" />
        <rect x="303" y="21" width="9" height="18" rx="2" />
        <rect x="46" y="6" width="15" height="48" rx="4" />
        <rect x="64" y="11" width="12" height="38" rx="4" />
        <rect x="78" y="16" width="9" height="28" rx="3" />
        <rect x="313" y="16" width="9" height="28" rx="3" />
        <rect x="324" y="11" width="12" height="38" rx="4" />
        <rect x="339" y="6" width="15" height="48" rx="4" />
      </g>
    </svg>
  );
}
