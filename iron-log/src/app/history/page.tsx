"use client";

import {
  CalendarDays,
  ChevronDown,
  Dumbbell,
  History,
  Play,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { isWorkingSet, sessionDurationMin, sessionVolume } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { Id } from "@/lib/types";
import {
  cn,
  formatCompact,
  formatFullDate,
  formatNumber,
  formatRelativeDay,
} from "@/lib/utils";

export default function HistoryPage() {
  const { db, index } = useIronLog();
  const [expanded, setExpanded] = useState<Id | null>(null);

  const sessions = useMemo(
    () =>
      [...db.sessions]
        .filter((session) => (index.setsBySession.get(session.id) ?? []).length > 0)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [db.sessions, index],
  );

  const dayNameById = useMemo(
    () => new Map(db.programDays.map((day) => [day.id, day.name])),
    [db.programDays],
  );

  const totalVolume = useMemo(() => {
    return sessions.reduce((acc, s) => acc + sessionVolume(index, s.id), 0);
  }, [sessions, index]);

  const totalSets = useMemo(() => {
    return sessions.reduce((acc, s) => {
      return acc + (index.setsBySession.get(s.id) ?? []).filter(isWorkingSet).length;
    }, 0);
  }, [sessions, index]);

  return (
    <div className="space-y-5 pt-1 animate-fade-in">
      <section className="plate space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl border border-line-strong bg-surface-2 text-fg-2">
              <History className="size-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-fg">سجل التمارين</h1>
              <p className="text-xs text-fg-3">تتبع الحصص والأوزان التاريخية</p>
            </div>
          </div>
          <span className="rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-bold text-fg-2">
            {sessions.length} حصة
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
            <span className="text-[10px] font-bold text-fg-3">إجمالي الحصص</span>
            <p className="num mt-0.5 text-lg font-semibold text-fg">{sessions.length}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
            <span className="text-[10px] font-bold text-fg-3">مجموع الأوزان</span>
            <p className="num mt-0.5 text-lg font-semibold text-steel">
              {formatCompact(totalVolume)} <span className="text-xs font-normal">كجم</span>
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
            <span className="text-[10px] font-bold text-fg-3">المجموعات</span>
            <p className="num mt-0.5 text-lg font-semibold text-fg">{totalSets}</p>
          </div>
        </div>
      </section>

      {sessions.length === 0 ? (
        <div className="plate space-y-4 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-line-strong bg-surface-2 text-fg-3">
            <CalendarDays className="size-6" />
          </div>
          <div className="mx-auto max-w-xs space-y-1">
            <h3 className="text-sm font-bold text-fg">لا توجد حصص مسجلة بعد</h3>
            <p className="text-xs leading-relaxed text-fg-3">
              عند تسجيلك أول تمرين، سيظهر هنا سجلك الكامل مع تفاصيل كل مجموعة ورقم قياسي.
            </p>
          </div>
          <Link
            href="/workout"
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-bg shadow-glowAccent"
          >
            <Play className="size-3.5 fill-current" />
            <span>ابدأ أول تمرين الآن</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const sets = (index.setsBySession.get(session.id) ?? []).filter(isWorkingSet);
            const duration = sessionDurationMin(index, session.id);
            const volume = sessionVolume(index, session.id);
            const isOpen = expanded === session.id;

            const byExercise: { exerciseId: Id; name: string; sets: typeof sets }[] = [];
            for (const entry of [...sets].sort((a, b) => a.createdAt - b.createdAt)) {
              const found = byExercise.find((g) => g.exerciseId === entry.exerciseId);
              if (found) {
                found.sets.push(entry);
              } else {
                byExercise.push({
                  exerciseId: entry.exerciseId,
                  name: index.exerciseNameById.get(entry.exerciseId) ?? "تمرين",
                  sets: [entry],
                });
              }
            }

            return (
              <div
                key={session.id}
                className={cn("plate overflow-hidden", isOpen && "border-accent/35")}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : session.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between p-4 text-start focus:outline-none"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-fg-2">
                      <Dumbbell className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-fg">
                          {session.programDayId
                            ? dayNameById.get(session.programDayId) ?? "حصة مخصصة"
                            : "حصة تدريب"}
                        </h3>
                        <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-bold text-fg-3">
                          {formatRelativeDay(session.date)}
                        </span>
                      </div>
                      <p className="num mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-fg-3">
                        <span className="font-bold text-fg-3">{formatNumber(volume)} كجم</span>
                        <span>·</span>
                        <span>{sets.length} مجموعات</span>
                        {duration ? (
                          <>
                            <span>·</span>
                            <span>{duration} دقيقة</span>
                          </>
                        ) : null}
                        {session.readiness ? (
                          <>
                            <span>·</span>
                            <span className="font-bold text-fg-2">جاهزية {session.readiness}/5</span>
                          </>
                        ) : null}
                      </p>
                      {session.note ? (
                        <p className="mt-1 truncate text-xs italic text-fg-3">{session.note}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 ps-2">
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full bg-surface-3 text-fg-3 transition-transform duration-200",
                        isOpen && "rotate-180 text-fg",
                      )}
                    >
                      <ChevronDown className="size-3.5" />
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <div className="space-y-3 border-t border-line p-4 animate-fade-in">
                    {byExercise.map((group) => (
                      <div key={group.exerciseId} className="space-y-1.5 rounded-xl border border-line bg-surface-2 p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-fg">{group.name}</h4>
                          <span className="text-[10.5px] font-bold text-fg-3">
                            {group.sets.length} مجموعات
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {group.sets.map((entry, idx) => (
                            <div
                              key={entry.id}
                              className="num inline-flex items-center gap-1 rounded-lg border border-line-strong bg-surface-3 px-2.5 py-1 text-xs font-bold text-fg-2"
                            >
                              <span className="text-[10px] font-normal text-fg-3">#{idx + 1}</span>
                              <span>
                                {formatNumber(entry.weightKg)} كجم × {entry.reps}
                              </span>
                              {entry.rpe ? (
                                <span className="text-[10px] font-semibold text-accent-glow">
                                  @{entry.rpe}
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
