"use client";

import { Calculator, Calendar, Check, ChevronDown, Dumbbell, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SportIcon } from "@/components/session/sport-icon";
import { AddExerciseForm } from "@/components/workout/add-exercise-form";
import { ExerciseLogger } from "@/components/workout/exercise-logger";
import { PlateCalculator } from "@/components/workout/plate-calculator";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { sessionDurationMin, sessionVolume } from "@/lib/metrics";
import { formatClock } from "@/lib/sports-config";
import { useIronLog } from "@/lib/store";
import { cn, formatFullDate, formatNumber, isIsoDate, toIsoDate } from "@/lib/utils";

/**
 * Tracks the rendered height of the app shell's `<header>` so this page's own
 * sticky strip can dock directly under it instead of overlapping it. The
 * shell header grew a second row (the global sport switcher) in an earlier
 * pass, so a hardcoded offset would already be wrong — a `ResizeObserver`
 * stays correct however tall it ends up being.
 */
function useStickyOffset(): number {
  const [top, setTop] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return undefined;
    const update = () => setTop(header.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return top;
}

export default function WorkoutPage() {
  const { db, index, actions } = useIronLog();
  const router = useRouter();
  const toast = useToast();
  const today = toIsoDate();
  const [date, setDate] = useState<string>(today);
  const [dayId, setDayId] = useState<string | null>(null);
  const [plateCalcOpen, setPlateCalcOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const stickyTop = useStickyOffset();

  const days = useMemo(
    () => [...db.programDays].sort((a, b) => a.order - b.order),
    [db.programDays],
  );

  const session = useMemo(
    () => db.sessions.find((item) => item.date === date) ?? null,
    [db.sessions, date],
  );

  useEffect(() => {
    if (days.length === 0) {
      if (dayId !== null) setDayId(null);
      return;
    }
    const fromSession = session?.programDayId;
    if (fromSession && days.some((day) => day.id === fromSession)) {
      if (dayId !== fromSession) setDayId(fromSession);
      return;
    }
    if (dayId === null || !days.some((day) => day.id === dayId)) {
      setDayId(days[0]?.id ?? null);
    }
  }, [days, session?.programDayId, date, dayId]);

  const activeDay = days.find((day) => day.id === dayId) ?? null;
  const attended = db.attendance[date] === true;
  const volumeToday = session ? sessionVolume(index, session.id) : 0;
  const setsToday = session ? (index.setsBySession.get(session.id) ?? []).length : 0;
  const durationToday = session ? sessionDurationMin(index, session.id) : null;

  /* ---- the live stopwatch ------------------------------------------------
     Ticks from the session row's own `createdAt` — the moment the first set
     landed today — rather than from a separate "workout started" flag the
     schema does not have. Nothing invented: before the first set there is
     nothing to count, so the clock sits at zero rather than pretending to
     run. Only ticks for today; a past date shows its settled duration. */
  const isToday = date === today;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isToday || !session) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isToday, session]);

  const liveElapsedSeconds =
    isToday && session ? Math.max(0, (now - session.createdAt) / 1000) : null;

  function finishWorkout() {
    toast.success(
      setsToday > 0
        ? `تم. ${setsToday} مجموعات بإجمالي ${formatNumber(volumeToday)} كجم`
        : "رجعنا للرئيسية",
    );
    router.push("/");
  }

  return (
    <div className="pt-1 animate-fade-in">
      {/* The one compact session strip — discipline, routine, live clock and
          volume, and the way out. Everything else (date, attendance,
          readiness) lives one tap away in the details sheet. */}
      <div
        className="sticky z-20 -mx-4 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:mt-0 sm:rounded-2xl sm:border sm:border-line-strong sm:px-3.5"
        style={{ top: stickyTop }}
      >
        <div className="flex h-10 items-center gap-2">
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-1.5 text-start"
          >
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-line-strong bg-surface-2 px-2 py-1 text-[10px] font-bold text-fg-2">
              <SportIcon sport="gym" className="size-3" />
              حديد
            </span>
            <span className="min-w-0 truncate text-[13.5px] font-bold text-fg">
              {activeDay?.name ?? "تمرين مخصص"}
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-fg-3" aria-hidden />
          </button>

          <div className="flex shrink-0 items-center gap-2.5">
            {liveElapsedSeconds !== null ? (
              <span className="num text-[13px] font-bold text-steel" dir="ltr">
                {formatClock(liveElapsedSeconds)}
              </span>
            ) : durationToday ? (
              <span className="num text-[12px] font-semibold text-fg-3" dir="ltr">
                {durationToday} د
              </span>
            ) : null}
            {setsToday > 0 ? (
              <span className="num text-[13px] font-bold text-accent-glow" dir="ltr">
                {formatNumber(volumeToday)} <span className="text-[10px] font-semibold text-fg-3">كجم</span>
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setPlateCalcOpen(true)}
            aria-label="حاسبة البار"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-fg-3 transition-colors hover:text-fg"
          >
            <Calculator className="size-4" aria-hidden />
          </button>

          <button
            type="button"
            onClick={finishWorkout}
            className="flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[11.5px] font-black text-bg shadow-glowAccent active:scale-95"
          >
            <Flag className="size-3" aria-hidden />
            إنهاء
          </button>
        </div>
      </div>

      <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        {days.map((day) => {
          const isActive = day.id === dayId;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => setDayId(day.id)}
              className={cn(
                "whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-colors",
                isActive
                  ? "bg-accent text-bg"
                  : "border border-line-strong bg-surface-2 text-fg-3 hover:text-fg",
              )}
            >
              {day.name}
            </button>
          );
        })}
      </div>

      {activeDay ? (
        <div className="mt-3 space-y-3">
          {activeDay.exerciseIds.length === 0 ? (
            <div className="plate space-y-2 p-6 text-center">
              <Dumbbell className="mx-auto size-8 text-fg-3" aria-hidden />
              <p className="text-xs text-fg-3">لا توجد تمارين مضافة لهذا اليوم حتى الآن</p>
            </div>
          ) : (
            activeDay.exerciseIds.map((exerciseId) => (
              <ExerciseLogger
                key={`${exerciseId}-${date}`}
                exerciseId={exerciseId}
                dayId={activeDay.id}
                date={date}
                editable
              />
            ))
          )}

          <div className="pt-2">
            <AddExerciseForm dayId={activeDay.id} />
          </div>
        </div>
      ) : null}

      <Sheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="تفاصيل الحصة"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
            <Calendar className="size-4 shrink-0 text-fg-3" aria-hidden />
            <input
              type="date"
              value={date}
              max={today}
              onChange={(event) => {
                const value = event.target.value;
                if (isIsoDate(value)) setDate(value);
              }}
              className="w-full bg-transparent text-[13px] font-medium text-fg focus:outline-none"
            />
          </div>

          <p className="px-0.5 text-[11.5px] text-fg-3">{formatFullDate(date)}</p>

          <button
            type="button"
            onClick={() => actions.toggleAttendance(date)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border p-3 transition-colors",
              attended
                ? "border-success/40 bg-success/15 text-fg"
                : "border-line bg-surface-2 text-fg-3 hover:text-fg",
            )}
          >
            <span className="text-[13px] font-bold">تسجيل الحضور</span>
            <div
              className={cn(
                "flex size-5 items-center justify-center rounded-full border transition-colors",
                attended ? "border-success bg-success text-bg" : "border-line-strong bg-transparent",
              )}
            >
              {attended ? <Check className="size-3 stroke-[3]" aria-hidden /> : null}
            </div>
          </button>

          <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2.5">
            <span className="text-[12px] font-bold text-fg-3">الجاهزية</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => {
                const isSelected = session?.readiness === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => actions.setSessionReadiness(date, isSelected ? null : level)}
                    className={cn(
                      "num flex size-7 items-center justify-center rounded-lg text-[11px] font-bold transition-colors",
                      isSelected ? "bg-accent text-bg" : "bg-surface-3 text-fg-3 hover:text-fg",
                    )}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {setsToday > 0 ? (
            <div className="flex items-center justify-between rounded-xl border border-accent/25 bg-accent/[0.06] px-3 py-2.5 text-[12.5px]">
              <span className="font-bold text-fg">{setsToday} مجموعات</span>
              <span className="num font-bold text-accent-glow" dir="ltr">
                {formatNumber(volumeToday)} كجم
              </span>
            </div>
          ) : null}
        </div>
      </Sheet>

      <PlateCalculator isOpen={plateCalcOpen} onClose={() => setPlateCalcOpen(false)} />
    </div>
  );
}
