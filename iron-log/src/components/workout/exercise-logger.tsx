"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Plus,
  Settings2,
  Sparkles,
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
        "h-8 w-full min-w-0 rounded-lg border border-white/[0.08] bg-[#0A0C10] px-1 text-center font-mono text-[13.5px] font-bold text-white outline-none transition-all placeholder:text-zinc-600 focus:border-[#CCFF00]/80 focus:bg-[#121620] focus:ring-1 focus:ring-[#CCFF00]/20",
        tone === "muted" ? "text-zinc-400 font-medium" : "text-zinc-100",
        disabled && "opacity-50",
      )}
    />
  );
}

const SET_GRID = "grid-cols-[30px_1fr_56px_46px_38px_42px]";

function TableHeader() {
  return (
    <div
      className={cn(
        "grid items-center gap-2 px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400",
        SET_GRID,
      )}
    >
      <span className="text-center">#</span>
      <span className="text-start">سابقاً</span>
      <span className="text-center">كجم</span>
      <span className="text-center">تكرار</span>
      <span className="text-center">جهد</span>
      <span className="text-center">إتمام</span>
    </div>
  );
}

function PreviousHint({ entry }: { entry: SetEntry | undefined }) {
  return (
    <span className="truncate font-mono text-[11.5px] font-medium text-zinc-400" dir="ltr">
      {entry ? `${formatNumber(entry.weightKg)} × ${entry.reps}` : "—"}
    </span>
  );
}

/** One already-logged set */
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
        "grid items-center gap-2 rounded-xl border px-2 py-1.5 transition-all",
        entry.isWarmup
          ? "border-amber-500/20 bg-amber-500/[0.04]"
          : "border-white/[0.06] bg-[#161922] shadow-sm",
        SET_GRID,
      )}
    >
      <span className="flex items-center justify-center">
        {entry.isWarmup ? (
          <Flame className="size-3.5 text-amber-400" aria-hidden />
        ) : (
          <span className="font-mono text-[12px] font-bold text-zinc-400">{displayIndex}</span>
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
        className="mx-auto flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#CCFF00] text-black font-black shadow-[0_0_12px_rgba(204,255,0,0.3)] transition-all hover:brightness-110 active:scale-90"
        title="اضغط للتراجع عن تسجيل الجولة"
      >
        <Check className="size-4" strokeWidth={3.5} aria-hidden />
      </button>
    </div>
  );
}

/** A planned set, still editable */
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
        "group relative grid items-center gap-2 rounded-xl border px-2 py-1.5 transition-all hover:border-white/20",
        row.isWarmup
          ? "border-amber-500/25 bg-amber-500/[0.02]"
          : "border-white/[0.05] bg-[#10131A]",
        SET_GRID,
      )}
    >
      <button
        type="button"
        onClick={() => onChange({ isWarmup: !row.isWarmup })}
        aria-pressed={row.isWarmup}
        aria-label="تبديل تسخين"
        className="flex items-center justify-center text-zinc-500 transition-colors hover:text-white"
        title={row.isWarmup ? "جولة تسخين" : "جولة أساسية (اضغط للتحويل لتسخين)"}
      >
        {row.isWarmup ? (
          <Flame className="size-3.5 text-amber-400" aria-hidden />
        ) : (
          <span className="font-mono text-[12px] font-bold">{displayIndex}</span>
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
          className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-[#171A24] text-zinc-400 transition-all hover:border-[#CCFF00] hover:bg-[#CCFF00]/15 hover:text-[#CCFF00] active:scale-90"
          title="اضغط لتأكيد وإتمام الجولة"
        >
          <Check className="size-4 opacity-50 group-hover:opacity-100" strokeWidth={2.5} />
        </button>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`إزالة المجموعة ${displayIndex}`}
            className="absolute -top-1.5 -end-1.5 hidden size-4 items-center justify-center rounded-full bg-red-500/80 text-white shadow group-hover:flex"
            title="حذف الجولة"
          >
            <X className="size-2.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

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

    if (db.settings.restAutoStart && !row.isWarmup) {
      rest.start(progression.restSeconds, lift.name);
    }

    setDrafts((prev) => {
      const next = prev.filter((d) => d.key !== row.key);
      if (next.length === 0) {
        return [emptyDraft({ weight: row.weight, reps: row.reps })];
      }
      return next;
    });

    toast.success(
      beatsBest && best !== null && !row.isWarmup ? "رقم قياسي جديد! 🔥" : "تم حفظ الجولة",
    );
  }

  function updateLogged(entry: SetEntry, patch: Partial<Pick<SetEntry, "weightKg" | "reps" | "rpe">>) {
    const result = actions.updateSet(entry.id, patch);
    if (!result.ok) toast.error(result.error);
  }

  function untickLogged(entry: SetEntry) {
    actions.deleteSet(entry.id);
    toast.toast("تم التراجع عن الجولة");
  }

  const previousByIndex = previous?.sets ?? [];

  return (
    <Card className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12151D] p-0 shadow-2xl transition-all">
      {/* Exercise Card Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.05] bg-[#151924]/60 px-4 py-3.5 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[16px] font-black tracking-tight text-white">{exercise.name}</h3>
            <span className="shrink-0 rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[10.5px] font-bold text-zinc-300">
              {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
            </span>
          </div>

          {progress.length > 1 || best || previous ? (
            <div className="mt-1.5 flex items-center gap-2.5 text-[11px] text-zinc-400">
              {progress.length > 1 ? (
                <div className="flex items-center gap-1">
                  <Sparkline
                    values={progress.map((p) => p.estimated1rm)}
                    ariaLabel={`اتجاه تقدير 1RM لتمرين ${exercise.name}`}
                  />
                </div>
              ) : null}
              <span className="truncate">
                {previous ? `آخر مرة: ${formatRelativeDay(previous.date)}` : "لا يوجد تسجيل سابق"}
                {best ? (
                  <>
                    <span className="mx-1 text-zinc-600">·</span>
                    <span>الأفضل: </span>
                    <bdi dir="ltr" className="font-mono font-bold text-zinc-200">
                      {formatNumber(best.set.weightKg)} × {best.set.reps}
                    </bdi>
                  </>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>

        {/* Action Controls */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            aria-expanded={panelOpen}
            aria-label="إعدادات المكينة والتقدم"
            className={cn(
              "rounded-lg p-2 transition-colors",
              panelOpen
                ? "bg-[#CCFF00]/15 text-[#CCFF00]"
                : "text-zinc-400 hover:bg-white/[0.06] hover:text-white",
            )}
            title="إعدادات المكينة والتكرارات"
          >
            <Settings2 className="size-4" aria-hidden />
          </button>
          {editable ? (
            <>
              <button
                type="button"
                onClick={() => dayId && actions.reorderDayExercises(dayId, exerciseId, -1)}
                aria-label="تحريك لأعلى"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <ChevronUp className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => dayId && actions.reorderDayExercises(dayId, exerciseId, 1)}
                aria-label="تحريك لأسفل"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
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
                  toast.toast("تمت إزالة التمرين من جدول اليوم");
                }}
                aria-label={confirmRemove ? "اضغط للتأكيد: حذف التمرين" : "حذف التمرين من جدول اليوم"}
                className={cn(
                  "rounded-lg p-1.5 transition-colors",
                  confirmRemove
                    ? "bg-red-500/20 text-red-400"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-red-400",
                )}
                title={confirmRemove ? "اضغط مرة ثانية لتأكيد الحذف" : "حذف التمرين"}
              >
                <X className="size-4" aria-hidden />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Machine Setup Hint */}
      {exercise.setup ? (
        <div className="flex items-center gap-2 border-b border-white/[0.04] bg-[#0E1017] px-4 py-2 text-[11px] text-zinc-400">
          <Wrench className="size-3.5 text-zinc-500" aria-hidden />
          <span className="truncate">{exercise.setup}</span>
        </div>
      ) : null}

      {/* Modern Target Banner */}
      {target ? (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={applyTarget}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#171B26] p-2.5 text-start transition-all hover:border-[#CCFF00]/40 hover:bg-[#1C2130]"
            title="اضغط لتطبيق الهدف في الجولة الحالية"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#CCFF00]/10 text-[#CCFF00]">
                <Target className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-zinc-200">الهدف المقترح:</span>
                  <bdi dir="ltr" className="font-mono text-[12.5px] font-black text-white">
                    {target.weightKg > 0 ? `${formatNumber(target.weightKg)} كجم × ${target.reps}` : `${target.reps} تكرار`}
                  </bdi>
                </div>
                <p className="truncate text-[10.5px] text-zinc-400">{REASON_TEXT[target.reason]}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-lg bg-[#CCFF00] px-2.5 py-1 text-[11px] font-black text-black transition-transform active:scale-95">
              طبّق
            </span>
          </button>
        </div>
      ) : null}

      {/* Warmup Ramp Pills */}
      {ramp.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-2.5 text-[11px] text-zinc-400">
          <span className="font-bold text-zinc-300">تسخين مقترح:</span>
          {ramp.map((step) => (
            <button
              key={step.weightKg}
              type="button"
              onClick={() => addWarmupStep(step)}
              className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-1 font-mono text-[11px] font-bold text-amber-400 transition-all hover:bg-amber-500/20 active:scale-95"
            >
              <bdi dir="ltr">
                {formatNumber(step.weightKg)} × {step.reps}
              </bdi>
            </button>
          ))}
        </div>
      ) : null}

      {/* Exercise Config Panel */}
      {panelOpen ? (
        <div className="px-4 pt-2">
          <ExercisePanel exerciseId={exerciseId} onClose={() => setPanelOpen(false)} />
        </div>
      ) : null}

      {/* Main Sets Table */}
      <div className="mt-3 px-3">
        <TableHeader />
        <div className="space-y-1.5">
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

      {/* Footer / Add Set Action */}
      <div className="p-4 pt-3">
        <button
          type="button"
          onClick={appendDraft}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#161A24] text-[13px] font-bold text-zinc-200 shadow-sm transition-all hover:border-white/20 hover:bg-[#1E2332] hover:text-white active:scale-[0.99]"
        >
          <Plus className="size-4 text-[#CCFF00]" aria-hidden />
          <span>إضافة جولة</span>
        </button>

        {delta !== null || isPrToday ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2 border border-white/[0.04]">
            {delta !== null ? (
              <span
                className={cn(
                  "font-mono text-[12px] font-bold",
                  delta > 0 ? "text-emerald-400" : "text-zinc-400",
                )}
              >
                {delta > 0 ? "▲ " : delta < 0 ? "▼ " : "— "}
                {delta === 0
                  ? "نفس الوزن السابق"
                  : delta > 0
                    ? `+${formatNumber(delta)} كجم تطور عن آخر حصة`
                    : `${formatNumber(Math.abs(delta))} كجم أقل من السابق`}
              </span>
            ) : <span />}
            {isPrToday ? (
              <Badge className="bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/30 font-bold">
                <Trophy className="size-3 text-[#CCFF00] mr-1" aria-hidden />
                رقم قياسي جديد!
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

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

  function parseOptional(raw: string): number | null {
    if (raw.trim() === "") return null;
    return toFiniteNumber(raw);
  }

  return (
    <div className="space-y-3.5 rounded-2xl border border-white/10 bg-[#171B26] p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
        <p className="flex items-center gap-2 text-[12.5px] font-black text-white">
          <Wrench className="size-4 text-[#CCFF00]" aria-hidden />
          إعدادات المكينة وتطوير الأوزان
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق الإعداد"
          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div>
        <Label htmlFor={`setup-${exerciseId}`} className="text-zinc-300 text-xs">ضبط مقعد ومسند الجهاز</Label>
        <Input
          id={`setup-${exerciseId}`}
          value={exercise.setup}
          onChange={(event) => commit({ setup: event.target.value })}
          placeholder="مثال: المقعد 4، المسند 2، قبضة واسعة"
          maxLength={240}
          className="mt-1.5 bg-[#0C0E14] border-white/10 text-xs text-white"
        />
        <p className="mt-1 text-[10.5px] text-zinc-400">
          تثبيت ضبط المقعد يضمن مقارنة وتطور الأوزان بالشكل الصحيح.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`repmin-${exerciseId}`} className="text-zinc-300 text-xs">أقل تكرارات</Label>
          <Input
            id={`repmin-${exerciseId}`}
            type="number"
            inputMode="numeric"
            value={exercise.repMin === null ? "" : String(exercise.repMin)}
            onChange={(event) => commit({ repMin: parseOptional(event.target.value) })}
            placeholder={String(db.settings.repMin)}
            className="mt-1.5 bg-[#0C0E14] border-white/10 font-mono text-xs text-white"
          />
        </div>
        <div>
          <Label htmlFor={`repmax-${exerciseId}`} className="text-zinc-300 text-xs">أقصى تكرارات</Label>
          <Input
            id={`repmax-${exerciseId}`}
            type="number"
            inputMode="numeric"
            value={exercise.repMax === null ? "" : String(exercise.repMax)}
            onChange={(event) => commit({ repMax: parseOptional(event.target.value) })}
            placeholder={String(db.settings.repMax)}
            className="mt-1.5 bg-[#0C0E14] border-white/10 font-mono text-xs text-white"
          />
        </div>
        <div>
          <Label htmlFor={`inc-${exerciseId}`} className="text-zinc-300 text-xs">خطوة الوزن (كجم)</Label>
          <Input
            id={`inc-${exerciseId}`}
            type="number"
            inputMode="decimal"
            value={exercise.incrementKg === null ? "" : String(exercise.incrementKg)}
            onChange={(event) => commit({ incrementKg: parseOptional(event.target.value) })}
            placeholder={String(db.settings.incrementKg)}
            className="mt-1.5 bg-[#0C0E14] border-white/10 font-mono text-xs text-white"
          />
        </div>
        <div>
          <Label htmlFor={`rest-${exerciseId}`} className="text-zinc-300 text-xs">الراحة (ثواني)</Label>
          <Input
            id={`rest-${exerciseId}`}
            type="number"
            inputMode="numeric"
            value={exercise.restSeconds === null ? "" : String(exercise.restSeconds)}
            onChange={(event) => commit({ restSeconds: parseOptional(event.target.value) })}
            placeholder={String(db.settings.restSeconds)}
            className="mt-1.5 bg-[#0C0E14] border-white/10 font-mono text-xs text-white"
          />
        </div>
      </div>
    </div>
  );
}