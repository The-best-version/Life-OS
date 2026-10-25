"use client";

import {
  ChevronDown,
  ChevronUp,
  Flame,
  Settings2,
  Target,
  Trash2,
  Trophy,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRestTimer } from "@/components/workout/rest-timer";
import {
  bestSetFor,
  estimate1rm,
  isWorkingSet,
  overloadTarget,
  previousSessionSets,
  progressionRules,
  warmupRamp,
} from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import {
  MUSCLE_GROUP_LABELS,
  type Id,
  type IsoDate,
  type OverloadReason,
  type SetEntry,
} from "@/lib/types";
import {
  cn,
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

const REASON_TEXT: Record<OverloadReason, string> = {
  first: "أول مرة — ابدأ بوزن تقدر تكمل به المدى كامل",
  "add-reps": "كمّل تكرارات على نفس الوزن قبل ما تزيد",
  "increase-weight": "وصلت أعلى المدى آخر مرة — زِد الوزن ونزّل التكرارات",
  hold: "آخر مرة كانت أقل من المدى — ثبّت الوزن حتى تضبطه",
  repeat: "كرّر آخر حصة",
};

/**
 * One exercise, one card: the target for today, what you did last time, the
 * machine's own settings, what you are doing now, and every set logged today.
 *
 * The inputs start pre-filled with the target rather than with the last set,
 * because the point of the screen is the next step, not the last one — and after
 * a save they hold what was just logged, so a 4-set exercise is four taps.
 */
export function ExerciseLogger({
  exerciseId,
  dayId,
  date,
  editable,
}: ExerciseLoggerProps) {
  const { db, index, actions } = useIronLog();
  const toast = useToast();
  const rest = useRestTimer();

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

  const target = useMemo(
    () => overloadTarget(db, index, exerciseId, session?.id ?? null),
    [db, index, exerciseId, session],
  );

  const rules = useMemo(
    () => (exercise ? progressionRules(db, exercise) : null),
    [db, exercise],
  );

  /**
   * Pre-fill source, in order of usefulness: the last set logged today (you are
   * mid-exercise), else today's target (you are starting it), else nothing.
   */
  const suggestion = useMemo(() => {
    const lastToday = todaysSets[todaysSets.length - 1];
    if (lastToday) return { weight: lastToday.weightKg, reps: lastToday.reps };
    if (target && target.weightKg > 0) {
      return { weight: target.weightKg, reps: target.reps };
    }
    const lastPrevious = previous?.sets[previous.sets.length - 1];
    if (lastPrevious) {
      return { weight: lastPrevious.weightKg, reps: lastPrevious.reps };
    }
    return null;
  }, [todaysSets, target, previous]);

  // Initial value only — afterwards the fields are the user's, and `handleSave`
  // rewrites them to what was just logged so the next set repeats it.
  const [weight, setWeight] = useState(() =>
    suggestion ? String(suggestion.weight) : "",
  );
  const [reps, setReps] = useState(() =>
    suggestion ? String(suggestion.reps) : "",
  );
  const [rpe, setRpe] = useState<number | null>(null);
  const [isWarmup, setIsWarmup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  if (!exercise || !rules) return null;

  /* Re-bound after the guard so the closures below carry the narrowed type:
     TypeScript does not propagate a narrowing from the enclosing scope into a
     function body, because it cannot prove when that function runs. */
  const lift = exercise;
  const progression = rules;

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

  const ramp =
    todaysSets.length === 0 && target && target.weightKg > 0
      ? warmupRamp(target.weightKg, rules.incrementKg)
      : [];

  function applyTarget() {
    if (!target) return;
    if (target.weightKg > 0) setWeight(String(target.weightKg));
    setReps(String(target.reps));
    setIsWarmup(false);
    setError(null);
  }

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
      rpe,
      isWarmup,
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

    /* Rest starts after the set has landed, never before: the save can still be
       refused by validation, and a clock already counting down on a set that was
       never recorded is the kind of thing that makes a user stop trusting it.
       A warm-up gets no auto-rest — you walk straight into the working set. */
    if (db.settings.restAutoStart && !isWarmup) {
      rest.start(progression.restSeconds, lift.name);
    }
    // The warm-up flag is a per-set choice, not a mode; it resets after each save.
    setIsWarmup(false);
    setRpe(null);

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
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1  text-[11px] text-fg-3">
            <span className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-sans text-[10px] font-bold">
              {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
            </span>
            {previous ? (
              <span>
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
              </span>
            ) : (
              <span>ما فيه تسجيل سابق</span>
            )}
          </p>
          {best ? (
            <p className="mt-0.5  text-[11px] text-fg-3">
              أفضل رقم: <bdi>{formatNumber(best.set.weightKg)} كجم</bdi> ×{" "}
              {best.set.reps}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-label="إعدادات المكينة والتقدم"
            className={cn(
              "rounded-sm p-1.5 transition-colors",
              panelOpen
                ? "text-accent-glow"
                : "text-fg-3 hover:text-fg",
            )}
          >
            <Settings2 className="size-4" aria-hidden />
          </button>
          {editable ? (
            <>
              <button
                type="button"
                onClick={() =>
                  dayId && actions.reorderDayExercises(dayId, exerciseId, -1)
                }
                aria-label="تحريك لأعلى"
                className="rounded-sm p-1.5 text-fg-3 transition-colors hover:text-fg"
              >
                <ChevronUp className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() =>
                  dayId && actions.reorderDayExercises(dayId, exerciseId, 1)
                }
                aria-label="تحريك لأسفل"
                className="rounded-sm p-1.5 text-fg-3 transition-colors hover:text-fg"
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
                    ? "rounded-sm p-1.5 text-accent-glow"
                    : "rounded-sm p-1.5 text-fg-3 transition-colors hover:text-accent-glow"
                }
              >
                <X className="size-4" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* The machine's own settings — the thing that makes the load repeatable. */}
      {exercise.setup ? (
        <p className="mt-2.5 flex items-start gap-1.5 rounded-md border border-line-strong bg-surface-2/60 px-2.5 py-2  text-[11.5px] leading-relaxed text-fg-3">
          <Wrench className="mt-[2px] size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 break-words">{exercise.setup}</span>
        </p>
      ) : null}

      {/* Today's target. */}
      {target ? (
        <button
          type="button"
          onClick={applyTarget}
          className="mt-2.5 flex w-full items-center gap-2.5 rounded-md border border-accent/30 p-2.5 text-start transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          style={{ backgroundImage: "var(--molten-soft)" }}
        >
          <Target className="size-4 shrink-0 text-accent-glow" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-1.5">
              <span className="text-[10.5px] font-bold text-fg-3">
                هدف اليوم
              </span>
              <span className="figure text-[17px] text-fg" dir="ltr">
                {target.weightKg > 0
                  ? `${formatNumber(target.weightKg)} × ${target.reps}`
                  : `× ${target.reps}`}
              </span>
              <span className="text-[10px] font-bold text-fg-3">
                {target.weightKg > 0 ? "كجم" : "تكرار"}
              </span>
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-fg-3">
              {REASON_TEXT[target.reason]}
            </span>
          </span>
          <span className="shrink-0 rounded-sm border border-accent/40 px-2 py-1 text-[10.5px] font-extrabold text-accent-glow">
            طبّقه
          </span>
        </button>
      ) : null}

      {/* Warm-up ramp: offered only before the first set of the exercise. */}
      {ramp.length > 0 ? (
        <p className="mt-2 flex flex-wrap items-center gap-2  text-[11px] text-fg-3">
          <span className="font-sans font-bold">تسخين مقترح:</span>
          {ramp.map((step) => (
            <button
              key={step.weightKg}
              type="button"
              onClick={() => {
                setWeight(String(step.weightKg));
                setReps(String(step.reps));
                setIsWarmup(true);
                setError(null);
              }}
              className="rounded-sm border border-line-strong px-2 py-1 transition-colors hover:border-accent/50 hover:text-fg"
            >
              <bdi dir="ltr">
                {formatNumber(step.weightKg)}×{step.reps}
              </bdi>
            </button>
          ))}
        </p>
      ) : null}

      {/* Per-machine configuration. */}
      {panelOpen ? (
        <ExercisePanel
          exerciseId={exerciseId}
          onClose={() => setPanelOpen(false)}
        />
      ) : null}

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
            className="mt-1 num"
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
            className="mt-1 num"
          />
        </div>
        <Button onClick={handleSave} className="shrink-0">
          حفظ
        </Button>
      </div>

      {/* Set qualifiers: effort and whether this one counts. */}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <button
          type="button"
          onClick={() => setIsWarmup((value) => !value)}
          aria-pressed={isWarmup}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10.5px] font-extrabold transition-colors",
            isWarmup
              ? "border-accent/50 bg-accent/15 text-accent-glow"
              : "border-line-strong text-fg-3 hover:text-fg",
          )}
        >
          تسخين
        </button>

        <span className="ms-1  text-[10px] text-fg-3">
          الجهد
        </span>
        {[6, 7, 8, 9, 10].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRpe((current) => (current === value ? null : value))}
            aria-pressed={rpe === value}
            aria-label={`جهد ${value} من 10`}
            className={cn(
              "figure size-7 rounded-full border text-[11px] transition-colors",
              rpe === value
                ? "border-accent bg-accent text-white"
                : "border-line-strong text-fg-3 hover:text-fg",
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[11.5px] font-bold text-accent-glow">
          {error}
        </p>
      ) : null}

      {/* Today's sets */}
      {todaysSets.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {todaysSets.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2",
                entry.isWarmup
                  ? "border border-dashed border-line-strong bg-transparent"
                  : "bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full  text-[10px]",
                  entry.isWarmup
                    ? "text-fg-3"
                    : "bg-background text-fg-3",
                )}
              >
                {entry.isWarmup ? (
                  <Flame className="size-3" aria-hidden />
                ) : (
                  entry.setIndex
                )}
              </span>
              {/* <bdi> isolates each run: without it the trailing rep count and
                  the leading "1RM" reorder into one unreadable "101RM". */}
              <span className="num flex flex-1 flex-wrap items-baseline gap-x-2  text-[12.5px] font-bold">
                <bdi>
                  {formatNumber(entry.weightKg)} كجم × {entry.reps}
                </bdi>
                {entry.isWarmup ? (
                  <bdi className="font-normal text-fg-3">تسخين</bdi>
                ) : (
                  <bdi className="font-normal text-fg-3">
                    1RM ≈ {formatNumber(estimate1rm(entry.weightKg, entry.reps))}
                  </bdi>
                )}
                {entry.rpe !== null ? (
                  <bdi className="font-normal text-fg-3">
                    RPE {formatNumber(entry.rpe)}
                  </bdi>
                ) : null}
              </span>
              <button
                type="button"
                onClick={() => {
                  actions.deleteSet(entry.id);
                  toast.toast("تم حذف المجموعة");
                }}
                aria-label={`حذف المجموعة ${entry.setIndex}`}
                className="shrink-0 rounded-sm p-1 text-fg-3 transition-colors hover:text-accent-glow"
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
                  ? "num  text-[12px] font-bold text-success"
                  : "num  text-[12px] font-bold text-fg-3"
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

/**
 * Per-machine configuration: the setup note, the rep window progression works
 * inside, the load step this machine actually offers, and its rest.
 *
 * Every numeric field here may be left empty, and empty means "use the global
 * setting" rather than zero — so clearing a field is a real action, not a
 * validation error.
 */
function ExercisePanel({
  exerciseId,
  onClose,
}: {
  exerciseId: Id;
  onClose: () => void;
}) {
  const { db, actions } = useIronLog();
  const toast = useToast();
  const exercise = db.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return null;

  const rules = progressionRules(db, exercise);

  function commit(patch: Parameters<typeof actions.updateExercise>[1]) {
    const result = actions.updateExercise(exerciseId, patch);
    if (!result.ok) toast.error(result.error);
  }

  /** Empty field → `null` (follow the global setting), not zero. */
  function parseOptional(raw: string): number | null {
    if (raw.trim() === "") return null;
    return toFiniteNumber(raw);
  }

  return (
    <div className="mt-3 space-y-3 rounded-md border border-line-strong bg-background/60 p-3 animate-sheet-up">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[12px] font-extrabold">
          <Wrench className="size-3.5 text-accent-glow" aria-hidden />
          إعداد المكينة والتقدم
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق الإعداد"
          className="rounded-sm p-1 text-fg-3 transition-colors hover:text-fg"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>

      <div>
        <Label htmlFor={`setup-${exerciseId}`}>ضبط المكينة</Label>
        <Input
          id={`setup-${exerciseId}`}
          value={exercise.setup}
          onChange={(event) => commit({ setup: event.target.value })}
          placeholder="مثال: المقعد على 4، المسند 2، القبضة عريضة"
          maxLength={240}
          className="mt-1 text-sm font-normal"
        />
        <p className="mt-1 text-[10.5px] leading-relaxed text-fg-3">
          الوزن بلا ضبط ما يتكرر — أي تغيير في المقعد يغيّر المدى ويغيّر معنى الرقم.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <Label htmlFor={`repmin-${exerciseId}`}>أقل تكرارات</Label>
          <Input
            id={`repmin-${exerciseId}`}
            type="number"
            inputMode="numeric"
            value={exercise.repMin === null ? "" : String(exercise.repMin)}
            onChange={(event) =>
              commit({ repMin: parseOptional(event.target.value) })
            }
            placeholder={String(db.settings.repMin)}
            className="mt-1 num"
          />
        </div>
        <div>
          <Label htmlFor={`repmax-${exerciseId}`}>أكثر تكرارات</Label>
          <Input
            id={`repmax-${exerciseId}`}
            type="number"
            inputMode="numeric"
            value={exercise.repMax === null ? "" : String(exercise.repMax)}
            onChange={(event) =>
              commit({ repMax: parseOptional(event.target.value) })
            }
            placeholder={String(db.settings.repMax)}
            className="mt-1 num"
          />
        </div>
        <div>
          <Label htmlFor={`inc-${exerciseId}`}>خطوة الوزن (كجم)</Label>
          <Input
            id={`inc-${exerciseId}`}
            type="number"
            inputMode="decimal"
            value={
              exercise.incrementKg === null ? "" : String(exercise.incrementKg)
            }
            onChange={(event) =>
              commit({ incrementKg: parseOptional(event.target.value) })
            }
            placeholder={String(db.settings.incrementKg)}
            className="mt-1 num"
          />
        </div>
        <div>
          <Label htmlFor={`rest-${exerciseId}`}>الراحة (ثانية)</Label>
          <Input
            id={`rest-${exerciseId}`}
            type="number"
            inputMode="numeric"
            value={
              exercise.restSeconds === null ? "" : String(exercise.restSeconds)
            }
            onChange={(event) =>
              commit({ restSeconds: parseOptional(event.target.value) })
            }
            placeholder={String(db.settings.restSeconds)}
            className="mt-1 num"
          />
        </div>
      </div>

      <p className=" text-[10.5px] text-fg-3">
        المطبّق الآن: <bdi dir="ltr">{rules.repMin}–{rules.repMax}</bdi> تكرار ·
        خطوة <bdi dir="ltr">{formatNumber(rules.incrementKg)}</bdi> كجم · راحة{" "}
        <bdi dir="ltr">{rules.restSeconds}</bdi> ثانية. الحقل الفاضي يعني
        «اتبع الإعدادات العامة».
      </p>
    </div>
  );
}
