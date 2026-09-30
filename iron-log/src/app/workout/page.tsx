"use client";

import { Dumbbell } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { AddExerciseForm } from "@/components/workout/add-exercise-form";
import { ExerciseLogger } from "@/components/workout/exercise-logger";
import { sessionVolume } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { formatFullDate, formatNumber, isIsoDate, toIsoDate } from "@/lib/utils";

/**
 * The logging screen — the one that has to work with one hand, mid-set, on a
 * phone. Day template on top, then the date and attendance, then one card per
 * exercise.
 */
export default function WorkoutPage() {
  const { db, index, actions } = useIronLog();
  const toast = useToast();

  const today = toIsoDate();
  const [date, setDate] = useState<string>(today);
  const [dayId, setDayId] = useState<string | null>(null);

  const days = useMemo(
    () => [...db.programDays].sort((a, b) => a.order - b.order),
    [db.programDays],
  );

  const session = useMemo(
    () => db.sessions.find((item) => item.date === date) ?? null,
    [db.sessions, date],
  );

  // Pick a sensible day: whatever this date's session already used, else the
  // first template. Re-runs if the program changes under us.
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
    // `dayId` is intentionally read but not depended on for the session branch,
    // so switching tabs manually is not immediately overridden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, session?.programDayId, date]);

  const activeDay = days.find((day) => day.id === dayId) ?? null;
  const attended = db.attendance[date] === true;
  const volumeToday = session ? sessionVolume(index, session.id) : 0;
  const setsToday = session
    ? (index.setsBySession.get(session.id) ?? []).length
    : 0;

  if (days.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="ما فيه أيام تدريب"
        description="برنامجك فاضي. استعد البرنامج الافتراضي من صفحة الإعدادات."
        className="mt-6"
      />
    );
  }

  return (
    <div className="space-y-3 pb-6">
      <section className="relative iron-ember overflow-hidden py-5">
        <p className="font-mono text-[11px] text-muted-foreground">
          {formatFullDate(date)}
        </p>
        <h1 className="mt-1 text-[38px] font-black leading-none animate-rise-in">
          {activeDay?.name ?? "تمرين"}
        </h1>
        <p className="mt-2 text-[13px] font-medium text-muted-foreground">
          {activeDay?.focus}
        </p>
        {setsToday > 0 ? (
          <p className="tnum mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-xs text-muted-foreground">
            {setsToday} مجموعة ·{" "}
            <span className="font-bold text-foreground">
              {formatNumber(volumeToday)} كجم
            </span>
          </p>
        ) : null}
      </section>

      <Tabs
        value={dayId ?? ""}
        onValueChange={(value) => setDayId(value)}
        dir="rtl"
      >
        <TabsList aria-label="أيام البرنامج">
          {days.map((day) => (
            <TabsTrigger key={day.id} value={day.id}>
              {day.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <Card className="space-y-3 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="session-date">تاريخ الحصة</Label>
              <Input
                id="session-date"
                type="date"
                value={date}
                max={today}
                onChange={(event) => {
                  const next = event.target.value;
                  // A cleared or half-typed date must not blank the whole screen.
                  if (isIsoDate(next)) setDate(next);
                }}
                className="mt-1"
              />
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <Label htmlFor="attendance">حضرت النادي؟</Label>
              <Switch
                id="attendance"
                checked={attended}
                onCheckedChange={() => {
                  actions.toggleAttendance(date);
                  toast.toast(attended ? "شيلنا الحضور" : "سجّلنا حضورك");
                }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="session-note">ملاحظة على الحصة</Label>
            <Input
              id="session-note"
              value={session?.note ?? ""}
              onChange={(event) =>
                actions.setSessionNote(date, event.target.value)
              }
              placeholder="مثال: نوم قليل، الأداء أقل من المعتاد"
              maxLength={500}
              className="mt-1 text-sm font-normal"
            />
          </div>
        </Card>

        {days.map((day) => (
          <TabsContent key={day.id} value={day.id} className="space-y-2.5">
            {day.exerciseIds.length === 0 ? (
              <EmptyState
                icon={Dumbbell}
                title="ما فيه تمارين في هذا اليوم"
                description="ضيف تمريناً من الحقل تحت."
              />
            ) : (
              day.exerciseIds.map((exerciseId) => (
                <ExerciseLogger
                  // Keyed by exercise AND date so switching either resets the
                  // pre-filled inputs to the right suggestion.
                  key={`${exerciseId}-${date}`}
                  exerciseId={exerciseId}
                  dayId={day.id}
                  date={date}
                  editable
                />
              ))
            )}

            <div className="pt-1">
              <AddExerciseForm dayId={day.id} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
