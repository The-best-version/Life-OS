"use client";

/**
 * The multi-sport session screen.
 *
 * This is the one place that knows how an ENGINE is worked:
 *
 *   "rounds"              a round clock + the round tracker (boxing)
 *   "stopwatch"/"distance" an open dial + the sport's own fields (riding, running)
 *   "sets"                 handed to /workout, because the gym already has a
 *                          far deeper surface than this screen could offer —
 *                          per-machine increments, warm-up ramps, double
 *                          progression and the plate calculator all live there.
 *
 * The gym is not a second-class discipline here; it is the one whose logging
 * screen was already built. Rebuilding it as four generic steppers would have
 * been a visible redesign and an invisible amputation.
 */

import { ArrowLeft, Dumbbell } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdaptiveTimer,
  useAthleticTimer,
  type TimerPhase,
} from "@/components/session/adaptive-timer";
import { LiveSessionHUD } from "@/components/session/live-session-hud";
import { RoundTracker } from "@/components/session/round-tracker";
import { SessionStartCard } from "@/components/session/session-start-card";
import { SportSelector, useSportFilter } from "@/components/session/sport-selector";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClass } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { liveSession } from "@/lib/athletic-metrics";
import { ALL_SPORTS, getSport } from "@/lib/sports-config";
import { useIronLog } from "@/lib/store";
import type { AthleticField, SportId } from "@/lib/types";
import { cn, toFiniteNumber, toIsoDate } from "@/lib/utils";

/** The gaits an equestrian session can tag. Chips, because there are four. */
const GAITS: Array<{ id: string; label: string }> = [
  { id: "walk", label: "مشي" },
  { id: "trot", label: "هرولة" },
  { id: "canter", label: "قفز" },
  { id: "gallop", label: "ركض" },
];

export default function SessionPage() {
  const { db, actions } = useIronLog();
  const { sport: filter, setSport } = useSportFilter();

  /* The screen needs a real discipline, so the overview falls back to boxing
     — the first sport whose whole session is logged here rather than in the
     gym's own screen. */
  const selected: SportId =
    filter === ALL_SPORTS || filter === "gym" ? "boxing" : filter;
  const sport = getSport(selected);

  const live = useMemo(() => liveSession(db), [db]);
  const liveSport = live ? getSport(live.sport) : null;

  const [mode, setMode] = useState(sport.modes[0]?.id ?? "");
  const [finishOpen, setFinishOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // A different discipline means a different set of modes; keep the chip valid.
  useEffect(() => {
    if (!sport.modes.some((m) => m.id === mode)) {
      setMode(sport.modes[0]?.id ?? "");
    }
  }, [sport, mode]);

  /* ---- the live clock -------------------------------------------------
     Elapsed is derived from `startedAt` and not kept in state, so a reload
     mid-session comes back on the right second rather than at zero. */
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [live]);
  const elapsedSeconds = live ? Math.max(0, (now - live.startedAt) / 1000) : 0;

  /* ---- the round cycle ------------------------------------------------
     The dial counts one leg; this screen owns the cycle. On a work leg
     reaching zero the round is banked and the break ARMS AND STARTS itself;
     on a break reaching zero the next round is armed but waits for a press,
     because a round nobody chose to begin is a round nobody committed to. */
  const [phase, setPhase] = useState<TimerPhase>("work");

  const onLegDone = useCallback(() => {
    if (!live || liveSport?.engine !== "rounds") return;
    if (phase === "work") {
      actions.completeRound(live.id);
      setPhase("rest");
    } else {
      setPhase("work");
    }
  }, [actions, live, liveSport, phase]);

  const legSeconds =
    liveSport?.engine === "rounds"
      ? phase === "work"
        ? liveSport.timer.work
        : liveSport.timer.rest
      : 0;

  const timer = useAthleticTimer({
    seconds: legSeconds,
    countsDown: liveSport?.engine === "rounds",
    autoStart: liveSport?.timer.autoStart ?? false,
    onComplete: onLegDone,
  });

  /* Re-arm the dial whenever the leg changes.
     Three cases, and the middle one is the whole rule:
       the break  — arms AND starts itself, because rest you did not take is
                    the half of the technique a countdown cannot protect;
       round 2+   — armed and waiting, because a round nobody chose to begin
                    is a round nobody committed to;
       round 1    — starts, because pressing «ابدأ حصة» WAS that choice. */
  const firstRound = (live?.rounds ?? 0) === 0;
  useEffect(() => {
    if (!live || !liveSport) return;

    if (liveSport.engine === "rounds") {
      const autoStart =
        phase === "rest" || (firstRound && liveSport.timer.autoStart);
      timer.reset(legSeconds, autoStart);
      return;
    }

    /* An open engine's dial IS the session's clock, so it is armed from
       `startedAt` rather than from zero: a ride reopened twenty minutes in
       reads twenty minutes. Riding does not auto-start (you mount up before
       the clock matters); a run does, because pressing «ابدأ حصة» at the
       trailhead was the start. */
    timer.reset(0, liveSport.timer.autoStart, (Date.now() - live.startedAt) / 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, legSeconds, liveSport?.engine, live?.id]);

  /* ---- actions --------------------------------------------------------- */

  function start() {
    const result = actions.startSession({ sport: selected, mode, date: toIsoDate() });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setPhase("work");
    const next = getSport(selected);
    timer.reset(next.timer.work, next.timer.autoStart && next.engine === "rounds");
  }

  function openFinish() {
    if (!live || !liveSport) return;
    // Seed the sheet with what the session already knows, so finishing a ride
    // is a confirmation and not a re-entry.
    const seeded: Record<string, string> = {};
    for (const field of liveSport.fields) {
      const value = live[field.key];
      seeded[field.key] = value === null || value === undefined ? "" : String(value);
    }
    // The clock is the better witness for a duration nobody typed.
    if (seeded.minutes === "" && elapsedSeconds > 60) {
      seeded.minutes = String(Math.round(elapsedSeconds / 60));
    }
    setDraft(seeded);
    setFinishOpen(true);
  }

  function finish() {
    if (!live || !liveSport) return;
    const patch: Record<string, number | null> = {};
    for (const field of liveSport.fields) {
      const raw = (draft[field.key] ?? "").trim();
      patch[field.key] = raw === "" ? null : toFiniteNumber(raw);
    }
    const result = actions.finishSession(live.id, patch as never);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setFinishOpen(false);
  }

  function toggleGait(gait: string) {
    if (!live) return;
    const next = live.gaits.includes(gait)
      ? live.gaits.filter((g) => g !== gait)
      : [...live.gaits, gait];
    actions.patchSession(live.id, { gaits: next });
  }

  /* ---- render ---------------------------------------------------------- */

  return (
    <div className="space-y-4 pt-1 animate-fade-in">
      <PageHero
        eyebrow="محرك الحصص"
        title={live ? "حصة جارية" : "ابدأ حصة"}
        subtitle={
          live
            ? "الشاشة تتبع رياضة الحصة الجارية، والمؤقت يحسب من لحظة البداية — لا من لحظة فتح الصفحة."
            : "اختر الرياضة، ثم النمط. كل رياضة تفتح سطح التسجيل الخاص بها."
        }
      >
        <SportSelector
          value={live ? live.sport : selected}
          onChange={(next) => {
            // While a session runs the switcher only moves the view; the live
            // session keeps its own discipline until it is finished.
            setSport(next);
          }}
          allOption={false}
        />
      </PageHero>

      {error ? (
        <p className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}

      {live && liveSport ? (
        <LiveSessionHUD
          session={live}
          elapsedSeconds={elapsedSeconds}
          onFinish={openFinish}
          onDiscard={() => actions.discardLiveSession()}
        >
          {liveSport.engine === "rounds" ? (
            <>
              <AdaptiveTimer
                phase={phase}
                label={phase === "work" ? `جولة ${(live.rounds ?? 0) + 1}` : "راحة"}
                caption={
                  liveSport.modes.find((m) => m.id === live.mode)?.label ?? undefined
                }
                timer={timer}
                onSkip={onLegDone}
              />
              <RoundTracker
                total={liveSport.timer.rounds}
                current={Math.min((live.rounds ?? 0) + 1, liveSport.timer.rounds)}
              />
            </>
          ) : (
            <>
              <AdaptiveTimer
                phase="open"
                label="الوقت المنقضي"
                caption={
                  liveSport.modes.find((m) => m.id === live.mode)?.label ?? undefined
                }
                timer={timer}
              />
              {live.sport === "equestrian" ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-3">
                    المشيات المستخدمة
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {GAITS.map((gait) => {
                      const on = live.gaits.includes(gait.id);
                      return (
                        <button
                          key={gait.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleGait(gait.id)}
                          className={cn(
                            "h-9 rounded-full border px-3.5 text-[12px] font-bold transition-colors",
                            on
                              ? "border-amber/60 bg-amber/12 text-amber"
                              : "border-line text-fg-3 hover:text-fg",
                          )}
                        >
                          {gait.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </LiveSessionHUD>
      ) : (
        <>
          <SessionStartCard
            sport={sport}
            mode={mode}
            onModeChange={setMode}
            onStart={start}
          />

          {/* The gym's door. It is a link and not an engine branch, because
              /workout is the gym's logging surface and always has been. */}
          <Link
            href="/workout"
            className={cn(
              buttonClass("secondary", "lg"),
              "w-full justify-between px-5",
            )}
          >
            <span className="flex items-center gap-2.5">
              <Dumbbell className="size-5" aria-hidden />
              حصة حديد؟ سجّلها في شاشة التمرين
            </span>
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
        </>
      )}

      <Sheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={`أنهِ حصة ${liveSport?.nameAr ?? ""}`}
        footer={
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={finish}>
              احفظ الحصة
            </Button>
            <Button variant="ghost" onClick={() => setFinishOpen(false)}>
              رجوع
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-fg-2">
            اتركِ أي خانة فارغة إذا لم تقِسها — الفراغ يعني «لم تُقَس»، والصفر
            يعني رقماً سجّلته فعلاً.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(liveSport?.fields ?? []).map((field) => (
              <Stepper
                key={field.key}
                id={`finish-${field.key}`}
                label={field.label}
                unit={field.unit || undefined}
                value={draft[field.key] ?? ""}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, [field.key]: value }))
                }
                step={field.step}
                min={field.min}
                max={field.max}
                decimals={field.step < 1 ? 2 : 0}
                inputMode={field.step < 1 ? "decimal" : "numeric"}
              />
            ))}
          </div>
        </div>
      </Sheet>
    </div>
  );
}

/* Keeps `AthleticField` in the import list honest: the draft is keyed by the
   sport's own field keys, and nothing else may leak into it. */
export type FinishDraft = Partial<Record<AthleticField, string>>;
