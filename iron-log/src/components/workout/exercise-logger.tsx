"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Plus,
  Settings2,
  Target,
  Trophy,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Sparkline } from "@/components/charts/sparkline";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useRestTimer } from "@/components/workout/rest-timer";
import {
  bestSetFor,
  exerciseProgress,
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
import { cn, createId, formatNumber, formatRelativeDay, maxOf, toFiniteNumber } from "@/lib/utils";

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

/** A set not yet written to the database, editable until its ring is tapped. */
interface DraftRow {
  key: string;
  weight: string;
  reps: string;
  /** Kept as text so a half-point (7.5) types naturally; parsed on commit. */
  rpeText: string;
  isWarmup: boolean;
}

function emptyDraft(seed?: Partial<Omit<DraftRow, "key">>): DraftRow {
  return {
    key: createId("draft"),
    weight: seed?.weight ?? "",
    reps: seed?.reps ?? "",
    rpeText: seed?.rpeText ?? "",
    isWarmup: seed?.isWarmup ?? false,
  };
}

/**
 * Seeds the draft queue the first time an exercise opens with nothing logged
 * today: the exact shape of last time's session (set count, warm-ups
 * included) if there is one, else the overload target, else one blank row.
 * This is what lets a repeat day be a row of taps instead of a row of typing.
 */
function seedDrafts(
  previous: { sets: SetEntry[] } | null,
  target: ReturnType<typeof overloadTarget>,
): DraftRow[] {
  if (previous && previous.sets.length > 0) {
    return previous.sets.map((s) =>
      emptyDraft({
        weight: String(s.weightKg),
        reps: String(s.reps),
        isWarmup: s.isWarmup,
      }),
    );
  }
  if (target) {
    return [
      emptyDraft({
        weight: target.weightKg > 0 ? String(target.weightKg) : "",
        reps: String(target.reps),
      }),
    ];
  }
  return [emptyDraft()];
}

/** A compact numeric cell shared by every row in the table. */
function Cell({
  value,
  onChange,
  onCommit,
  placeholder,
  decimal,
  disabled,
  tone = "default",
}: {
  value: string;
  onChange?: (value: string) => void;
  onCommit?: () => void;
  placeholder?: string;
  decimal?: boolean;
  disabled?: boolean;
  tone?: "default" | "muted";
}) {
  return (
    <input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange?.(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={cn(
        "num h-9 w-full min-w-0 rounded-lg border border-line bg-bg px-1 text-center text-[14px] font-bold outline-none transition-colors placeholder:text-fg-3/40 focus:border-accent/60",
        tone === "muted" ? "text-fg-2" : "text-fg",
        disabled && "opacity-60",
      )}
    />
  );
}

const SET_GRID = "grid-cols-[26px_1fr_54px_44px_36px_40px]";

function TableHeader() {
  return (
    <div
      className={cn(
        "grid items-center gap-1.5 px-1 pb-1 text-[9.5px] font-bold uppercase tracking-wide text-fg-3",
        SET_GRID,
      )}
    >
      <span className="text-center">#</span>
      <span>سابقاً</span>
      <span className="text-center">كجم</span>
      <span className="text-center">تكرار</span>
      <span className="text-center">جهد</span>
      <span />
    </div>
  );
}

function PreviousHint({ entry }: { entry: SetEntry | undefined }) {
  return (
    <span className="num truncate text-[11px] font-medium text-fg-3" dir="ltr">
      {entry ? `${formatNumber(entry.weightKg)}×${entry.reps}` : "—"}
    </span>
  );
}

/** One already-logged set. The inputs stay live, fixing a typo is an edit,
 *  not a delete-and-redo, and the check un-ticks into a delete. */
function LoggedRow({
  entry,
  displayIndex,
  previousEntry,
  onUpdate,
  onUntick,
}: {
  entry: SetEntry;
  displayIndex: number;
  previousEntry: SetEntry | undefined;
  onUpdate: (patch: Partial<Pick<SetEntry, "weightKg" | "reps" | "rpe">>) => void;
  onUntick: () => void;
}) {
  const [weight, setWeight] = useState(String(entry.weightKg));
  const [reps, setReps] = useState(String(entry.reps));
  const [rpeText, setRpeText] = useState(entry.rpe === null ? "" : String(entry.rpe));

  function commitWeight() {
    const value = toFiniteNumber(weight);
    if (value === null) {
      setWeight(String(entry.weightKg));
      return;
    }
    onUpdate({ weightKg: value });
  }
  function commitReps() {
    const value = toFiniteNumber(reps);
    if (value === null) {
      setReps(String(entry.reps));
      return;
    }
    onUpdate({ reps: value });
  }
  function commitRpe() {
    if (rpeText.trim() === "") {
      onUpdate({ rpe: null });
      return;
    }
    const value = toFiniteNumber(rpeText);
    if (value === null) {
      setRpeText(entry.rpe === null ? "" : String(entry.rpe));
      return;
    }
    onUpdate({ rpe: value });
  }

  return (
    <div
      className={cn(
        "grid items-center gap-1.5 rounded-lg px-1 py-1",
        SET_GRID,
        entry.isWarmup ? "border border-dashed border-line" : "bg-surface-2/60",
      )}
    >
      <span className="flex items-center justify-center text-fg-3">
        {entry.isWarmup ? (
          <Flame className="size-3.5 text-amber" aria-hidden />
        ) : (
          <span className="num text-[12px] font-bold">{displayIndex}</span>
        )}
      </span>
      <PreviousHint entry={previousEntry} />
      <Cell value={weight} onChange={setWeight} onCommit={commitWeight} decimal />
      <Cell value={reps} onChange={setReps} onCommit={commitReps} />
      <Cell value={rpeText} onChange={setRpeText} onCommit={commitRpe} placeholder="—" decimal tone="muted" />
      <button
        type="button"
        onClick={onUntick}
        aria-label={`إلغاء المجموعة ${displayIndex}`}
        className="mx-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-bg transition-transform active:scale-90"
      >
        <Check className="size-4" strokeWidth={3} aria-hidden />
      </button>
    </div>
  );
}

/** A planned set, still editable, nothing written yet. Tapping the ring
 *  commits it; the ring stays empty until then, a check that was never
 *  earned must not look earned. */
function DraftRowView({
  row,
  displayIndex,
  previousEntry,
  canRemove,
  onChange,
  onCommit,
  onRemove,
}: {
  row: DraftRow;
  displayIndex: number;
  previousEntry: SetEntry | undefined;
  canRemove: boolean;
  onChange: (patch: Partial<Omit<DraftRow, "key">>) => void;
  onCommit: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "group grid items-center gap-1.5 rounded-lg border border-dashed px-1 py-1",
        SET_GRID,
        row.isWarmup ? "border-amber/40" : "border-line-strong/70",
      )}
    >
      <button
        type="button"
        onClick={() => onChange({ isWarmup: !row.isWarmup })}
        aria-pressed={row.isWarmup}
        aria-label="تبديل تسخين"
        className="flex items-center justify-center text-fg-3 transition-colors hover:text-fg"
      >
        {row.isWarmup ? (
          <Flame className="size-3.5 text-amber" aria-hidden />
        ) : (
          <span className="num text-[12px] font-bold">{displayIndex}</span>
        )}
      </button>
      <PreviousHint entry={previousEntry} />
      <Cell value={row.weight} onChange={(v) => onChange({ weight: v })} decimal />
      <Cell value={row.reps} onChange={(v) => onChange({ reps: v })} />
      <Cell value={row.rpeText} onChange={(v) => onChange({ rpeText: v })} placeholder="—" decimal tone="muted" />
      <div className="relative mx-auto flex size-8 shrink-0 items-center justify-center">
        <button
          type="button"
          onClick={onCommit}
          aria-label={`تسجيل المجموعة ${displayIndex}`}
          className="flex size-8 items-center justify-center rounded-full border-2 border-line-strong transition-colors hover:border-accent/70 active:scale-90"
        />
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`إزالة المجموعة ${displayIndex}`}
            className="absolute -top-2 -end-1.5 hidden size-4 items-center justify-center rounded-full bg-surface-3 text-fg-3 group-hover:flex"
          >
            <X className="size-2.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * One exercise, one card: the target for today, what you did last time, the
 * machine's own settings, and a dense tappable set table.
 *
 * Rows come in two kinds sharing one grid: logged (real `SetEntry` rows,
 * live-editable) and draft (not yet written, seeded from last session's
 * shape so a repeat day is taps, not typing). Checking a draft writes it and
 * folds it into the logged list; unchecking a logged row deletes it.
 */
export function ExerciseLogger({ exerciseId, dayId, date, editable }: ExerciseLoggerProps) {
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

  const progress = useMemo(() => exerciseProgress(index, exerciseId), [index, exerciseId]);

  // Seeded once per mount, the parent remounts this component on every
  // exercise/date pair (`key={exerciseId-date}`), so a lazy initializer is
  // exactly right: it must not re-run just because a set was logged.
  const [drafts, setDrafts] = useState<DraftRow[]>(() => seedDrafts(previous, target));
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  if (!exercise || !rules) return null;
  const lift = exercise;
  const progression = rules;

  const previousTop = maxOf((previous?.sets ?? []).filter(isWorkingSet).map((s) => s.weightKg));
  const todayTop = maxOf(todaysSets.filter(isWorkingSet).map((s) => s.weightKg));
  const delta = previousTop !== null && todayTop !== null ? todayTop - previousTop : null;
  const isPrToday =
    todayTop !== null &&
    best !== null &&
    todayTop >= best.set.weightKg &&
    previousTop !== null &&
    todayTop > previousTop;

  const ramp =
    todaysSets.length === 0 && drafts.every((d) => !d.isWarmup) && target && target.weightKg > 0
      ? warmupRamp(target.weightKg, rules.incrementKg)
      : [];

  function patchDraft(key: string, patch: Partial<Omit<DraftRow, "key">>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function removeDraft(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  function appendDraft() {
    const lastDraft = drafts[drafts.length - 1];
    const lastLogged = todaysSets[todaysSets.length - 1];
    if (lastDraft) {
      setDrafts((prev) => [...prev, emptyDraft({ weight: lastDraft.weight, reps: lastDraft.reps })]);
      return;
    }
    if (lastLogged) {
      setDrafts((prev) => [
        ...prev,
        emptyDraft({ weight: String(lastLogged.weightKg), reps: String(lastLogged.reps) }),
      ]);
      return;
    }
    setDrafts((prev) => [...prev, emptyDraft()]);
  }

  function applyTarget() {
    if (!target) return;
    const patch: Partial<Omit<DraftRow, "key">> = {
      weight: target.weightKg > 0 ? String(target.weightKg) : "",
      reps: String(target.reps),
      isWarmup: false,
    };
    setDrafts((prev) => {
      const [first, ...rest] = prev;
      if (!first) return [emptyDraft(patch)];
      const updated: DraftRow = {
        key: first.key,
        weight: patch.weight ?? first.weight,
        reps: patch.reps ?? first.reps,
        rpeText: patch.rpeText ?? first.rpeText,
        isWarmup: patch.isWarmup ?? first.isWarmup,
      };
      return [updated, ...rest];
    });
  }

  function addWarmupStep(step: { weightKg: number; reps: number }) {
    setDrafts((prev) => [
      emptyDraft({ weight: String(step.weightKg), reps: String(step.reps), isWarmup: true }),
      ...prev,
    ]);
  }

  function commitDraft(row: DraftRow) {
    const weightValue = toFiniteNumber(row.weight);
    const repsValue = toFiniteNumber(row.reps);
    if (weightValue === null) {
      toast.error("اكتب الوزن");
      return;
    }
    if (repsValue === null) {
      toast.error("اكتب عدد التكرارات");
      return;
    }
    const rpeValue = row.rpeText.trim() === "" ? null : toFiniteNumber(row.rpeText);

    const result = actions.logSet({
      date,
      programDayId: dayId,
      exerciseId,
      weightKg: weightValue,
      reps: repsValue,
      rpe: rpeValue,
      isWarmup: row.isWarmup,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    const beatsBest = best === null || result.value.weightKg > best.set.weightKg;

    // Rest starts after the set has landed, never before: the save can still
    // be refused by validation. A warm-up gets no auto-rest, you walk
    // straight into the working set.
    if (db.settings.restAutoStart && !row.isWarmup) {
      rest.start(progression.restSeconds, lift.name);
    }

    setDrafts((prev) => {
      const next = prev.filter((d) => d.key !== row.key);
      // The queue ran dry, keep the flow going by repeating what was just
      // logged: a 4-set exercise is four taps.
      if (next.length === 0) {
        return [emptyDraft({ weight: row.weight, reps: row.reps })];
      }
      return next;
    });

    toast.success(
      beatsBest && best !== null && !row.isWarmup ? "رقم قياسي جديد!" : "انحفظت المجموعة",
    );
  }

  function updateLogged(entry: SetEntry, patch: Partial<Pick<SetEntry, "weightKg" | "reps" | "rpe">>) {
    const result = actions.updateSet(entry.id, patch);
    if (!result.ok) toast.error(result.error);
  }

  function untickLogged(entry: SetEntry) {
    actions.deleteSet(entry.id);
    toast.toast("تراجعنا عن المجموعة");
  }

  const previousByIndex = previous?.sets ?? [];

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-2 px-3.5 pt-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="truncate text-[15px] font-bold leading-snug text-fg">{exercise.name}</h3>
            <span className="shrink-0 rounded-full bg-surface-3 px-2 py-0.5 text-[10px] font-bold text-fg-3">
              {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
            </span>
          </div>
          {progress.length > 1 || best || previous ? (
            <div className="mt-1 flex items-center gap-2 text-[10.5px] text-fg-3">
              {progress.length > 1 ? (
                <Sparkline
                  values={progress.map((p) => p.estimated1rm)}
                  ariaLabel={`اتجاه تقدير 1RM لتمرين ${exercise.name}`}
                />
              ) : null}
              <span className="truncate">
                {previous ? `آخر مرة ${formatRelativeDay(previous.date)}` : "لا تسجيل سابق"}
                {best ? (
                  <>
                    {" · أفضل "}
                    <bdi dir="ltr" className="num font-bold text-fg-2">
                      {formatNumber(best.set.weightKg)}×{best.set.reps}
                    </bdi>
                  </>
                ) : null}
              </span>
            </div>
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
              panelOpen ? "text-accent-glow" : "text-fg-3 hover:text-fg",
            )}
          >
            <Settings2 className="size-4" aria-hidden />
          </button>
          {editable ? (
            <>
              <button
                type="button"
                onClick={() => dayId && actions.reorderDayExercises(dayId, exerciseId, -1)}
                aria-label="تحريك لأعلى"
                className="rounded-sm p-1.5 text-fg-3 transition-colors hover:text-fg"
              >
                <ChevronUp className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => dayId && actions.reorderDayExercises(dayId, exerciseId, 1)}
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
                aria-label={confirmRemove ? "اضغط للتأكيد: حذف التمرين من اليوم" : "حذف التمرين من اليوم"}
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

      {exercise.setup ? (
        <p className="mt-2 flex items-start gap-1.5 px-3.5 text-[11.5px] leading-relaxed text-fg-3">
          <Wrench className="mt-[2px] size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 break-words">{exercise.setup}</span>
        </p>
      ) : null}

      {target ? (
        <button
          type="button"
          onClick={applyTarget}
          className="mx-3.5 mt-2.5 flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/[0.06] px-2.5 py-2 text-start transition-colors hover:bg-accent/10"
        >
          <Target className="size-4 shrink-0 text-accent-glow" aria-hidden />
          <span className="num shrink-0 text-[13px] font-bold text-fg" dir="ltr">
            {target.weightKg > 0 ? `${formatNumber(target.weightKg)}×${target.reps}` : `×${target.reps}`}
          </span>
          <span className="min-w-0 flex-1 truncate text-[10.5px] leading-snug text-fg-3">
            {REASON_TEXT[target.reason]}
          </span>
          <span className="shrink-0 text-[10px] font-bold text-accent-glow">طبّق</span>
        </button>
      ) : null}

      {ramp.length > 0 ? (
        <div className="mx-3.5 mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px] text-fg-3">
          <span className="font-bold">تسخين:</span>
          {ramp.map((step) => (
            <button
              key={step.weightKg}
              type="button"
              onClick={() => addWarmupStep(step)}
              className="rounded-full border border-line-strong px-2 py-0.5 transition-colors hover:border-amber/50 hover:text-fg"
            >
              <bdi dir="ltr">
                {formatNumber(step.weightKg)}×{step.reps}
              </bdi>
            </button>
          ))}
        </div>
      ) : null}

      {panelOpen ? (
        <div className="px-3.5">
          <ExercisePanel exerciseId={exerciseId} onClose={() => setPanelOpen(false)} />
        </div>
      ) : null}

      <div className="mt-3 px-2.5 pb-1">
        <TableHeader />
        <div className="space-y-1">
          {todaysSets.map((entry, position) => (
            <LoggedRow
              key={entry.id}
              entry={entry}
              displayIndex={position + 1}
              previousEntry={previousByIndex[position]}
              onUpdate={(patch) => updateLogged(entry, patch)}
              onUntick={() => untickLogged(entry)}
            />
          ))}
          {drafts.map((row, position) => (
            <DraftRowView
              key={row.key}
              row={row}
              displayIndex={todaysSets.length + position + 1}
              previousEntry={previousByIndex[todaysSets.length + position]}
              canRemove={drafts.length > 1}
              onChange={(patch) => patchDraft(row.key, patch)}
              onCommit={() => commitDraft(row)}
              onRemove={() => removeDraft(row.key)}
            />
          ))}
        </div>
      </div>

      <div className="px-3.5 pb-3.5">
        <button
          type="button"
          onClick={appendDraft}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line-strong text-[12px] font-bold text-fg-3 transition-colors hover:border-accent/50 hover:text-fg"
        >
          <Plus className="size-3.5" aria-hidden />
          إضافة جولة
        </button>

        {delta !== null || isPrToday ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {delta !== null ? (
              <span
                className={cn(
                  "num text-[12px] font-bold",
                  delta > 0 ? "text-success" : "text-fg-3",
                )}
              >
                {/* Worded instead of signed: a leading minus inside Arabic
                    text is reordered by the bidi algorithm and renders
                    backwards. */}
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
      </div>
    </Card>
  );
}

/**
 * Per-machine configuration: the setup note, the rep window progression works
 * inside, the load step this machine actually offers, and its rest.
 *
 * Every numeric field here may be left empty, and empty means "use the global
 * setting" rather than zero, so clearing a field is a real action, not a
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

  /** Empty field, null (follow the global setting), not zero. */
  function parseOptional(raw: string): number | null {
    if (raw.trim() === "") return null;
    return toFiniteNumber(raw);
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-line-strong bg-surface-2 p-3 animate-sheet-up">
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
            onChange={(event) => commit({ repMin: parseOptional(event.target.value) })}
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
            onChange={(event) => commit({ repMax: parseOptional(event.target.value) })}
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
            value={exercise.incrementKg === null ? "" : String(exercise.incrementKg)}
            onChange={(event) => commit({ incrementKg: parseOptional(event.target.value) })}
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
            value={exercise.restSeconds === null ? "" : String(exercise.restSeconds)}
            onChange={(event) => commit({ restSeconds: parseOptional(event.target.value) })}
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
