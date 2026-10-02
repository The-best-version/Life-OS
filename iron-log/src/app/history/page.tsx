"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHero } from "@/components/layout/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  isWorkingSet,
  sessionDurationMin,
  sessionVolume,
} from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { Id } from "@/lib/types";
import {
  cn,
  formatFullDate,
  formatNumber,
  formatRelativeDay,
} from "@/lib/utils";

/** Every logged session, newest first, expandable down to the individual sets. */
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

  return (
    <div className="space-y-3 pb-6">
      <PageHero
        eyebrow="السجل"
        title={
          <span className="flex items-baseline gap-2">
            <span className="molten-text figure text-[46px]">
              {sessions.length}
            </span>
            <span className="text-base font-bold text-muted-foreground">
              حصة مسجّلة
            </span>
          </span>
        }
        subtitle="كل حصة قابلة للفتح حتى آخر مجموعة فيها"
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="السجل فاضي"
          description="أول ما تسجّل مجموعة من صفحة التمرين، تظهر الحصة هنا بكل تفاصيلها."
        />
      ) : (
        <ul className="space-y-2.5">
          {sessions.map((session) => {
            const sets = (index.setsBySession.get(session.id) ?? []).filter(
              isWorkingSet,
            );

            // Group by exercise, preserving the order the sets were logged in.
            const byExercise: { exerciseId: Id; name: string; sets: typeof sets }[] =
              [];
            for (const entry of [...sets].sort((a, b) => a.createdAt - b.createdAt)) {
              const found = byExercise.find(
                (group) => group.exerciseId === entry.exerciseId,
              );
              if (found) found.sets.push(entry);
              else
                byExercise.push({
                  exerciseId: entry.exerciseId,
                  name: index.exerciseNameById.get(entry.exerciseId) ?? "تمرين",
                  sets: [entry],
                });
            }

            const duration = sessionDurationMin(index, session.id);
            const isOpen = expanded === session.id;

            return (
              <li key={session.id}>
                <Card>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : session.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 p-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[14px] font-extrabold">
                        {session.programDayId
                          ? (dayNameById.get(session.programDayId) ?? "حصة")
                          : "حصة"}
                        <Badge variant="neutral">
                          {formatRelativeDay(session.date)}
                        </Badge>
                      </p>
                      <p className="tnum mt-1 font-mono text-[11px] text-muted-foreground">
                        {formatFullDate(session.date)} · {sets.length} مجموعة ·{" "}
                        {formatNumber(sessionVolume(index, session.id))} كجم
                        {duration !== null ? ` · ${duration} دقيقة` : null}
                        {session.readiness !== null
                          ? ` · جاهزية ${session.readiness}/5`
                          : null}
                      </p>
                      {session.note ? (
                        <p className="mt-1 truncate text-[11.5px] text-muted-foreground">
                          {session.note}
                        </p>
                      ) : null}
                    </div>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {isOpen ? (
                    <div className="space-y-2.5 border-t border-border p-4">
                      {byExercise.map((group) => (
                        <div key={group.exerciseId}>
                          <p className="text-[12.5px] font-bold">{group.name}</p>
                          <p className="tnum mt-0.5 font-mono text-[11.5px] text-muted-foreground">
                            {group.sets.map((entry, position) => (
                              <span key={entry.id}>
                                {position > 0 ? " · " : null}
                                {/* LTR isolate: "60×10" flips to "10×60"
                                    inside RTL text. */}
                                <bdi dir="ltr">
                                  {formatNumber(entry.weightKg)}×{entry.reps}
                                  {entry.rpe !== null
                                    ? ` @${formatNumber(entry.rpe)}`
                                    : null}
                                </bdi>
                              </span>
                            ))}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
