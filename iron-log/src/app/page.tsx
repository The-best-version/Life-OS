"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Dumbbell,
  Flame,
  Play,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Card } from "@/components/ui/card";
import {
  currentWeek,
  deloadSignal,
  muscleRecovery,
  suggestDay,
} from "@/lib/insights";
import { dashboardSummary, personalRecords } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { cn, formatCompact, toIsoDate } from "@/lib/utils";

export default function DashboardPage() {
  const { db, index } = useIronLog();
  const today = toIsoDate();

  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);
  const weekDays = useMemo(() => currentWeek(db, index), [db, index]);
  const nextDay = useMemo(() => suggestDay(db, index, today), [db, index, today]);
  const recovery = useMemo(() => muscleRecovery(db, index, today), [db, index, today]);
  const deload = useMemo(() => deloadSignal(db, index), [db, index]);
  const recentPrs = useMemo(() => personalRecords(db, index, 3), [db, index]);

  const hasTrainedToday = summary.todaySets > 0;
  const isBrandNew = summary.totalSetsLogged === 0;
  const attendanceRatio = Math.min(1, summary.weekAttended / Math.max(1, summary.weeklyGoal));

  const scheduledExercises = useMemo(() => {
    if (!nextDay) return [];
    return nextDay.exerciseIds
      .map((id) => db.exercises.find((e) => e.id === id && !e.archived))
      .filter((e): e is NonNullable<typeof e> => e !== undefined);
  }, [nextDay, db.exercises]);

  return (
    <div className="space-y-5 pt-2 animate-fade-in">
      {/* Week overview: one accent ring for the number that drives the week,
          two plain rows beside it — not three competing colours. */}
      <Card className="p-5">
        <div className="flex items-center gap-5">
          <div className="relative flex shrink-0 items-center justify-center">
            <svg className="size-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--line-strong))" strokeWidth="8" />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 * (1 - attendanceRatio)}
                style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.2,0.8,0.2,1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-[22px] font-semibold leading-none text-fg">
                {summary.weekAttended}/{summary.weeklyGoal}
              </span>
              <span className="mt-1 text-[9px] font-semibold text-fg-3">أيام</span>
            </div>
          </div>

          <div className="flex-1 space-y-2.5">
            <Row label="حجم الأسبوع" value={`${formatCompact(summary.weekVolumeKg)} كجم`} />
            <Row label="سلسلة الالتزام" value={`${summary.streak} يوم`} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-1.5 border-t border-line pt-4">
          {weekDays.map((d) => (
            <div
              key={d.date}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-semibold",
                d.trained
                  ? "bg-accent/15 text-accent-glow"
                  : d.isToday
                    ? "bg-surface-2 text-fg"
                    : "text-fg-3",
              )}
            >
              <span>{d.letter}</span>
              <span className="size-1.5 rounded-full bg-current opacity-70" />
            </div>
          ))}
        </div>
      </Card>

      {/* Today's protocol */}
      {hasTrainedToday ? (
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/12 px-3 py-1 text-[11px] font-bold text-success">
                <CheckCircle2 className="size-3.5" />
                حصة اليوم مكتملة
              </div>
              <h2 className="text-[19px] font-bold text-fg">أداء جيد اليوم</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-fg-2">
                أنجزت <span className="num font-semibold text-fg">{summary.todaySets}</span> مجموعة
                بإجمالي{" "}
                <span className="num font-semibold text-fg">
                  {formatCompact(summary.todayVolumeKg)} كجم
                </span>
                .
              </p>
            </div>
            <Link
              href="/workout"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-line-strong bg-surface-2 px-4 py-2.5 text-[13px] font-bold text-fg"
            >
              عرض أو تعديل الحصة
              <ChevronLeft className="size-4" />
            </Link>
          </div>
        </Card>
      ) : nextDay ? (
        <Card className="tread p-5">
          <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-accent" />
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/12 px-3 py-1 text-[11px] font-bold text-accent-glow">
              <Dumbbell className="size-3.5" />
              حصة اليوم المجدولة
            </span>
            <span className="text-[12px] font-semibold text-fg-3">
              {scheduledExercises.length} تمارين مجهزة
            </span>
          </div>

          <h2 className="display text-[30px] font-semibold uppercase leading-none text-fg">
            {nextDay.name}
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-fg-2">{nextDay.focus}</p>

          {scheduledExercises.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {scheduledExercises.slice(0, 5).map((ex) => (
                <span
                  key={ex.id}
                  className="rounded-lg border border-line-strong bg-surface-2 px-3 py-1.5 text-[12.5px] font-semibold text-fg-2"
                >
                  {ex.name}
                </span>
              ))}
              {scheduledExercises.length > 5 ? (
                <span className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-fg-3">
                  +{scheduledExercises.length - 5}
                </span>
              ) : null}
            </div>
          ) : null}

          <Link
            href="/workout"
            className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-accent px-6 py-3.5 text-[15px] font-bold text-white shadow-glowAccent transition-transform active:scale-[0.98]"
          >
            <Play className="size-4.5 fill-current" />
            <span>ابدأ التمرين الآن</span>
          </Link>
        </Card>
      ) : null}

      {/* Headline numbers */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          icon={Activity}
          label="الحجم الكلي"
          value={`${formatCompact(summary.totalVolumeKg)}`}
          unit="كجم"
          foot="مجموع الأوزان المحققة"
        />
        <StatTile
          icon={Trophy}
          label="أرقام قياسية (30 يوم)"
          value={`${summary.prsLast30Days}`}
          unit="PR"
          foot="تطور الأوزان والتكرارات"
        />
        <StatTile
          icon={Flame}
          label="إجمالي الحصص"
          value={`${summary.totalSessions}`}
          unit="حصة"
          foot="في مسيرتك الرياضية"
        />
      </section>

      {/* Deload warning — danger is earned here, not decorative */}
      {deload.level !== "none" ? (
        <Card className="border-danger/30 bg-danger/[0.05] p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-danger/30 bg-danger/12 text-danger">
              <AlertTriangle className="size-4" />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-danger">تنبيه إجهاد تراكمي</h3>
                <span className="rounded-full border border-danger/30 bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger">
                  مؤشر ديلود
                </span>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-fg-2">
                {deload.reasons.join(" · ")}. يُنصح بتخفيف الأحجام 40-50% هذا الأسبوع لتفريغ التعب
                العصبي وحماية المفاصل.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Recent PRs — success is earned here too */}
      {recentPrs.length > 0 ? (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-fg">
              <Trophy className="size-4 text-fg-3" />
              أحدث الأرقام القياسية
            </h3>
            <Link href="/history" className="text-[12px] font-bold text-accent-glow">
              عرض السجل
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {recentPrs.map((pr) => (
              <Card key={`${pr.exerciseId}-${pr.date}`} className="flex items-center justify-between p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-bold text-fg">{pr.exerciseName}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-fg-3">
                    <span className="num font-bold text-fg">{pr.weightKg} كجم</span> ×{" "}
                    <span className="num font-bold text-fg">{pr.reps} تكرار</span>
                  </p>
                </div>
                {pr.gainKg !== null ? (
                  <span className="num shrink-0 rounded-full border border-success/30 bg-success/12 px-2.5 py-1 text-[11px] font-bold text-success">
                    +{pr.gainKg} كجم
                  </span>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Muscle recovery */}
      {!isBrandNew ? (
        <section className="space-y-2.5">
          <h3 className="flex items-center gap-2 px-1 text-[15px] font-bold text-fg">
            <Activity className="size-4 text-fg-3" />
            حالة الاستشفاء العضلي
          </h3>

          <Card className="p-4">
            <div className="flex flex-wrap gap-2">
              {recovery.map((m) => {
                const isReady = m.state === "ready" || m.state === "fresh";
                const isToday = m.state === "today";

                return (
                  <div
                    key={m.group}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-bold",
                      isToday
                        ? "border-accent/30 bg-accent/12 text-accent-glow"
                        : isReady
                          ? "border-line-strong bg-surface-2 text-fg"
                          : "border-danger/25 bg-danger/8 text-danger",
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        isToday ? "bg-accent-glow" : isReady ? "bg-fg-3" : "bg-danger",
                      )}
                    />
                    <span>{m.label}</span>
                    <span className="text-[10px] font-medium opacity-70">
                      {isToday ? "تدرّبت اليوم" : m.daysSince !== null ? `${m.daysSince} يوم` : "جاهزة"}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
      <span className="text-[12.5px] font-semibold text-fg-2">{label}</span>
      <span className="num text-[14px] font-semibold text-fg">{value}</span>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  unit,
  foot,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  unit: string;
  foot: string;
}) {
  return (
    <Card className="flex flex-col justify-between p-4">
      <div className="flex items-center justify-between text-fg-3">
        <span className="text-[12px] font-bold">{label}</span>
        <Icon className="size-4" />
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-1.5">
          <span className="num text-[26px] font-semibold text-fg">{value}</span>
          <span className="text-[11px] font-bold text-fg-3">{unit}</span>
        </div>
        <p className="mt-1 text-[11px] font-medium text-fg-3">{foot}</p>
      </div>
    </Card>
  );
}
