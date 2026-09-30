"use client";

import { ChevronDown, ChevronUp, Trash2, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import {
  bestSetFor,
  estimate1rm,
  isWorkingSet,
  previousSessionSets,
} from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import type { Id, IsoDate, SetEntry } from "@/lib/types";
import {
  formatNumber,
  formatRelativeDay,
  maxOf,
  toFiniteNumber,
} from "@/lib/utils";

interface ExerciseLoggerProps {
  exerciseId: Id;
  dayId: Id | null;
  date: IsoDate;
  /** Controls whether the reorder/remove buttons are shown. */
  editable: boolean;
}

/**
 * One exercise, one card: what you did last time, what you are doing now, and
 * every set logged today.
 *
 * The inputs start pre-filled with the most recent set for this lift, because the
 * overwhelmingly common case is "same weight, same reps, next set" — and after a
 * save they keep those values, so a 4-set exercise is four taps.
 */
export function ExerciseLogger({
  exerciseId,
  dayId,
  date,
  editable,
}: ExerciseLoggerProps) {
  const { db, index, actions } = useIronLog();
  const toast = useToast();

  const exercise = db.exercises.find((item) => item.id === exerciseId);

  const session = useMemo(
    () => db.sessions.find((item) => item.date === date) ?? null,
    [db.sessions, date],
  );

  const todaysSets = useMemo<SetEntry[]>(() => {
    if (!session) return [];
    return (index.setsBySession.get(session.id) ?? [])
      .filter((entry) => entry.exerciseId === exerciseId)
      .sort((a, b) => a.setIndex - b.setIndex);
  }, [index, session, exerciseId]);

  const previous = useMemo(
    () => previousSessionSets(index, exerciseId, session?.id ?? null),
    [index, exerciseId, session],
  );

  const best = useMemo(() => bestSetFor(index, exerciseId), [index, exerciseId]);

  /** Pre-fill source: the last set today, else the last set last time. */
  const suggestion = useMemo(() => {
    const lastToday = todaysSets[todaysSets.length - 1];
    if (lastToday) return { weight: lastToday.weightKg, reps: lastToday.reps };
    const lastPrevious = previous?.sets[previous.sets.length - 1];
    if (lastPrevious) {
      return { weight: lastPrevious.weightKg, reps: lastPrevious.reps };
    }
    return null;
  }, [todaysSets, previous]);

  // Initial value only — afterwards the fields are the user's, and `onSave`
  // rewrites them to what was just logged so the next set repeats it.
  const [weight, setWeight] = useState(() =>
    suggestion ? String(suggestion.weight) : "",
  );
  const [reps, setReps] = useState(() =>
    suggestion ? String(suggestion.reps) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!exercise) return null;

  const previousTop = maxOf(
    (previous?.sets ?? []).filter(isWorkingSet).map((s) => s.weightKg),
  );
  const todayTop = maxOf(todaysSets.filter(isWorkingSet).map((s) => s.weightKg));
  const delta =
    previousTop !== null && todayTop !== null ? todayTop - previousTop : null;
  const isPrToday =
    todayTop !== null &&
    best !== null &&
    todayTop >= best.set.weightKg &&
    previousTop !== null &&
    todayTop > previousTop;

  function handleSave() {
    const weightValue = toFiniteNumber(weight);
    const repsValue = toFiniteNumber(reps);

    if (weightValue === null) {
      setError("اكتب الوزن");
      return;
    }
    if (repsValue === null) {
      setError("اكتب عدد التكرارات");
      return;
    }

    const result = actions.logSet({
      date,
      programDayId: dayId,
      exerciseId,
      weightKg: weightValue,
      reps: repsValue,
    });

    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    setError(null);
    setWeight(String(result.value.weightKg));
    setReps(String(result.value.reps));

    const beatsBest = best === null || result.value.weightKg > best.set.weightKg;
    toast.success(
      beatsBest && best !== null ? "🏆 رقم قياسي جديد!" : "انحفظت المجموعة",
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14.5px] font-extrabold leading-snug">
            {exercise.name}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {previous ? (
              <>
                {`آخر مرة (${formatRelativeDay(previous.date)}): `}
                {previous.sets.map((entry, position) => (
                  <span key={entry.id}>
                    {position > 0 ? " · " : null}
                    {/* LTR isolate: "60×10" flips to "10×60" in RTL text. */}
                    <bdi dir="ltr">
                      {formatNumber(entry.weightKg)}×{entry.reps}
                    </bdi>
                  </span>
                ))}
              </>
            ) : (
              "ما فيه تسجيل سابق"
            )}
          </p>
          {best ? (
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              أفضل رقم: {formatNumber(best.set.weightKg)} كجم ×{" "}
              {best.set.reps}
            </p>
          ) : null}
        </div>

        {editable ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() =>
                dayId && actions.reorderDayExercises(dayId, exerciseId, -1)
              }
              aria-label="تحريك لأعلى"
              className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronUp className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() =>
                dayId && actions.reorderDayExercises(dayId, exerciseId, 1)
              }
              aria-label="تحريك لأسفل"
              className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!dayId) return;
                if (!confirmRemove) {
                  setConfirmRemove(true);
                  window.setTimeout(() => setConfirmRemove(false), 3000);
                  return;
                }
                actions.removeExerciseFromDay(dayId, exerciseId);
                toast.toast("شيلنا التمرين من هذا اليوم (السجل محفوظ)");
              }}
              aria-label={
                confirmRemove
                  ? "اضغط للتأكيد: حذف التمرين من اليوم"
                  : "حذف التمرين من اليوم"
              }
              className={
                confirmRemove
                  ? "rounded-sm p-1.5 text-primary"
                  : "rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-primary"
              }
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {/* Entry row */}
      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <Label htmlFor={`w-${exerciseId}`}>الوزن (كجم)</Label>
          <Input
            id={`w-${exerciseId}`}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            value={weight}
            onChange={(event) => {
              setWeight(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSave();
            }}
            aria-invalid={error !== null}
            placeholder="0"
            className="mt-1 tnum"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor={`r-${exerciseId}`}>التكرارات</Label>
          <Input
            id={`r-${exerciseId}`}
            type="number"
            inputMode="numeric"
            step="1"
            min="1"
            value={reps}
            onChange={(event) => {
              setReps(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSave();
            }}
            aria-invalid={error !== null}
            placeholder="0"
            className="mt-1 tnum"
          />
        </div>
        <Button onClick={handleSave} className="shrink-0">
          حفظ
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[11.5px] font-bold text-primary">
          {error}
        </p>
      ) : null}

      {/* Today's sets */}
      {todaysSets.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {todaysSets.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-2"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background font-mono text-[10px] text-muted-foreground">
                {entry.setIndex}
              </span>
              {/* <bdi> isolates each run: without it the trailing rep count and
                  the leading "1RM" reorder into one unreadable "101RM". */}
              <span className="tnum flex flex-1 items-baseline gap-2 font-mono text-[12.5px] font-bold">
                <bdi>
                  {formatNumber(entry.weightKg)} كجم × {entry.reps}
                </bdi>
                <bdi className="font-normal text-muted-foreground">
                  1RM ≈ {formatNumber(estimate1rm(entry.weightKg, entry.reps))}
                </bdi>
              </span>
              <button
                type="button"
                onClick={() => {
                  actions.deleteSet(entry.id);
                  toast.toast("تم حذف المجموعة");
                }}
                aria-label={`حذف المجموعة ${entry.setIndex}`}
                className="shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:text-primary"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {/* Comparison against last time */}
      {delta !== null || isPrToday ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {delta !== null ? (
            <span
              className={
                delta > 0
                  ? "tnum font-mono text-[12px] font-bold text-success"
                  : "tnum font-mono text-[12px] font-bold text-muted-foreground"
              }
            >
              {/* Worded instead of signed: a leading "−" inside Arabic text is
                  reordered by the bidi algorithm and renders as "5−". */}
              {delta > 0 ? "▲ " : delta < 0 ? "▼ " : "— "}
              {delta === 0
                ? "نفس آخر مرة"
                : delta > 0
                  ? `${formatNumber(delta)} كجم أكثر من آخر مرة`
                  : `${formatNumber(Math.abs(delta))} كجم أقل من آخر مرة`}
            </span>
          ) : null}
          {isPrToday ? (
            <Badge className="animate-pop-in">
              <Trophy className="size-3" aria-hidden />
              رقم قياسي جديد
            </Badge>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
