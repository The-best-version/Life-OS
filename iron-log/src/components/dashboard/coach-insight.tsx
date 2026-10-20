"use client";

import { AlertCircle, Award, Dumbbell, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { DashboardSummary } from "@/lib/metrics";

export function CoachInsight({ summary }: { summary: DashboardSummary }) {
  // 1. Check for stalled lifts
  if (summary.stalled.length > 0) {
    const topStall = summary.stalled[0];
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-[#16130D]/90 to-[#0F1420]/95 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-amber-500/50">
        <div className="flex items-start gap-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
            <AlertCircle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-black text-amber-400">
                تنبيه رادار الثبات
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-500/30">
                {summary.stalled.length} {summary.stalled.length === 1 ? "تمرين ثابت" : "تمارين ثابتة"}
              </span>
            </div>
            <p className="mt-1 text-[13.5px] font-black text-white">
              تمرين «{topStall?.exerciseName}» لم يرتفع وزنه التقديري منذ {topStall?.sessionsStalled} حصص.
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-300">
              جرّب تغيير المدى التكراري (مثلاً من 8 إلى 12 عدة) أو استبدال الجهاز لتفعيل التحفيز العضلي مجدداً وفك الثبات.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Check for recent personal records
  if (summary.prsLast30Days > 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/15 via-[#16140B]/90 to-[#0F1420]/95 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-yellow-500/50">
        <div className="flex items-start gap-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-yellow-500/20 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.3)]">
            <Award className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-black text-yellow-400">
                إنجاز وتطور مستمر
              </span>
              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-extrabold text-yellow-300 border border-yellow-500/30">
                {summary.prsLast30Days} أرقام قياسية (PRs)
              </span>
            </div>
            <p className="mt-1 text-[13.5px] font-black text-white">
              حققت {summary.prsLast30Days} رقماً قياسياً جديداً في آخر 30 يوماً! 🔥
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-300">
              الزيادة التدريجية تسير بشكل ممتاز؛ حافظ على جودة التكنيك والاستشفاء بين الحصص.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Check for undertrained muscle groups
  if (summary.underTrained.length > 0 && summary.totalSessions > 0) {
    const list = summary.underTrained.slice(0, 3).map((m) => m.label).join("، ");
    return (
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 via-[#0C151F]/90 to-[#0F1420]/95 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-cyan-500/50">
        <div className="flex items-start gap-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Dumbbell className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11.5px] font-black text-cyan-400">
                توجيه الجرعة الأسبوعية
              </span>
            </div>
            <p className="mt-1 text-[13.5px] font-black text-white">
              عضلات تحتاج تركيزاً هذا الأسبوع: {list}.
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-300">
              هذه المجموعات ما زالت دون الحد الأدنى الفعال للبناء (MEV). أضف لها 2–3 مجموعات في حصتك القادمة لضمان التطور.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Default motivation for active users
  if (summary.totalSessions > 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-[#16121D]/90 to-[#0F1420]/95 p-4 backdrop-blur-xl shadow-lg transition-all hover:border-primary/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-[0_0_12px_rgba(255,42,85,0.3)]">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <p className="text-[13.5px] font-black text-white">
                جاهز لحصتك القادمة يا بطل؟
              </p>
              <p className="text-[12px] text-slate-300">
                سجلت {summary.totalSessions} حصة حتى الآن بإجمالي {Math.round(summary.totalVolumeKg).toLocaleString()} كجم مرفوعة.
              </p>
            </div>
          </div>
          <Link
            href="/workout"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-[#B80028] px-4 py-2 text-[12px] font-black text-white shadow-[0_0_15px_rgba(255,42,85,0.4)] transition-all hover:scale-[1.03] active:scale-95"
          >
            <Sparkles className="size-3.5" />
            <span>تسجيل تمرين</span>
          </Link>
        </div>
      </div>
    );
  }

  // 5. Welcome state for newcomers
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-[#16121D]/90 to-[#0F1420]/95 p-5 text-center backdrop-blur-xl shadow-lg">
      <p className="text-[15px] font-black text-white">
        مرحباً بك في Iron Log — متتبع تمرينك الاحترافي 🏋️
      </p>
      <p className="mt-1 text-[12.5px] text-slate-300">
        ابدأ بتسجيل أول حصة تدريبية اليوم لتفعيل رسوم التقدم والجرعات العضلية وسلسلة الالتزام.
      </p>
      <Link
        href="/workout"
        className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#B80028] px-5 py-2.5 text-[13px] font-black text-white shadow-[0_0_20px_rgba(255,42,85,0.45)] transition-all hover:scale-[1.03]"
      >
        <span>ابدأ أول تمرين الآن 🚀</span>
      </Link>
    </div>
  );
}
