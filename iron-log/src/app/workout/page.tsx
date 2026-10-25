"use client";

import { Calculator, Calendar, Check, Dumbbell, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AddExerciseForm } from "@/components/workout/add-exercise-form";
import { ExerciseLogger } from "@/components/workout/exercise-logger";
import { PlateCalculator } from "@/components/workout/plate-calculator";
import { sessionDurationMin, sessionVolume } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { cn, formatFullDate, formatNumber, isIsoDate, toIsoDate } from "@/lib/utils";

export default function WorkoutPage() {
  const { db, index, actions } = useIronLog();
  const today = toIsoDate();
  const [date, setDate] = useState<string>(today);
  const [dayId, setDayId] = useState<string | null>(null);
  const [plateCalcOpen, setPlateCalcOpen] = useState(false);

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

  return (
    <div className="space-y-4 pt-1 animate-fade-in">
      <section className="plate space-y-4 p-4 sm:p-5">
        <div className="flex flex-col justify-between gap-3 border-b border-line pb-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-accent/30 bg-accent/12 px-2.5 py-0.5 text-[10px] font-bold text-accent-glow">
                بروتوكول اليوم
              </span>
              <span className="text-[11px] font-medium text-fg-3">{formatFullDate(date)}</span>
            </div>
            <h1 className="mt-1 text-xl font-bold text-fg sm:text-2xl">
              {activeDay?.name ?? "تمرين مخصص"}
            </h1>
            {activeDay?.focus ? (
              <p className="mt-0.5 text-xs font-semibold text-fg-3">
                التركيز: <span className="text-fg-3">{activeDay.focus}</span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPlateCalcOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface-2 px-3 py-2 text-xs font-bold text-fg-2 transition-colors hover:text-fg"
            >
              <Calculator className="size-3.5" />
              <span>حاسبة البار</span>
            </button>

            {setsToday > 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5">
                <Sparkles className="size-3.5 text-accent-glow" />
                <div className="text-end">
                  <span className="num text-xs font-semibold text-accent-glow">
                    {formatNumber(volumeToday)} كجم
                  </span>
                  <p className="text-[9.5px] font-medium text-accent-glow/80">
                    {setsToday} مجاميع {durationToday ? `· ${durationToday} د` : ""}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => actions.toggleAttendance(date)}
            className={cn(
              "flex items-center justify-between rounded-xl border p-2.5 transition-colors",
              attended
                ? "border-success/40 bg-success/15 text-fg"
                : "border-line bg-surface-2 text-fg-3 hover:text-fg",
            )}
          >
            <span className="text-xs font-bold">تسجيل الحضور</span>
            <div
              className={cn(
                "flex size-5 items-center justify-center rounded-full border transition-colors",
                attended ? "border-success bg-success text-black" : "border-line-strong bg-transparent",
              )}
            >
              {attended ? <Check className="size-3 stroke-[3]" /> : null}
            </div>
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-1.5">
            <Calendar className="size-3.5 shrink-0 text-fg-3" />
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => {
                const val = e.target.value;
                if (isIsoDate(val)) setDate(val);
              }}
              className="w-full bg-transparent text-xs font-medium text-fg focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-1">
            <span className="text-[11px] font-bold text-fg-3">الجاهزية:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const isSelected = session?.readiness === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => actions.setSessionReadiness(date, isSelected ? null : lvl)}
                    className={cn(
                      "size-6 rounded-lg text-[10px] font-bold transition-colors",
                      isSelected ? "bg-accent text-bg" : "bg-surface-3 text-fg-3 hover:text-fg",
                    )}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
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
        <div className="space-y-3">
          {activeDay.exerciseIds.length === 0 ? (
            <div className="plate space-y-2 p-6 text-center">
              <Dumbbell className="mx-auto size-8 text-fg-3" />
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

      <PlateCalculator isOpen={plateCalcOpen} onClose={() => setPlateCalcOpen(false)} />
    </div>
  );
}
