"use client";

import { AlertTriangle, Flame } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import {
  SportSelector,
  useSportFilter,
} from "@/components/session/sport-selector";
import { RestTimerBar, RestTimerProvider } from "@/components/workout/rest-timer";
import { activeDates, liveSession } from "@/lib/athletic-metrics";
import { currentStreak, dashboardSummary } from "@/lib/metrics";
import { getSport } from "@/lib/sports-config";
import { useIronLog } from "@/lib/store";
import { formatCompact, formatFullDate, toIsoDate } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { db, index, status, storage } = useIronLog();
  const { sport, setSport } = useSportFilter();
  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);

  /* The streak in the header counts ANY discipline, not gym days: a ride on
     Tuesday keeps it alive, which is the whole premise of a multi-sport
     tracker and would be a lie if this chip read gym attendance only. */
  const streak = useMemo(() => currentStreak(activeDates(db, index)), [db, index]);
  const live = useMemo(() => liveSession(db), [db]);

  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3 lg:max-w-4xl">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg border border-accent/35 bg-accent/15">
              <span className="size-2.5 rounded-full bg-accent-glow" />
            </span>
            <div>
              <div className="flex items-baseline gap-0.5" dir="ltr">
                <span className="display text-[17px] font-semibold uppercase tracking-wide text-fg">
                  Iron
                </span>
                <span className="display text-[17px] font-semibold uppercase tracking-wide text-accent-glow">
                  Log
                </span>
              </div>
              <p className="text-[11px] font-medium text-fg-3">
                {formatFullDate(toIsoDate())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {live ? (
              /* A session that is running outranks every other reading here:
                 it is the one thing the header can tell you that you cannot
                 see on the screen you are on. */
              <span className="flex items-center gap-1.5 rounded-lg border border-steel/40 bg-steel/10 px-3 py-1.5 text-[11px] font-bold text-steel">
                <span aria-hidden className="size-1.5 rounded-full bg-current" />
                {getSport(live.sport).nameAr} جارية
              </span>
            ) : summary.todaySets > 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5">
                <div className="text-end leading-none">
                  <span className="num text-[13px] font-semibold text-accent-glow">
                    {formatCompact(summary.todayVolumeKg)} كجم
                  </span>
                  <p className="mt-0.5 text-[9px] font-semibold text-fg-3">
                    {summary.todaySets} مجموعات
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface px-3 py-1.5">
                <Flame className="size-4 text-fg-3" />
                <span className="num text-[13px] font-semibold text-fg">{streak}</span>
                <span className="text-[10px] font-semibold text-fg-3">يوم</span>
              </div>
            )}
          </div>
        </div>

        {/* The global discipline switcher. One row, scrollable, under the
            wordmark: every screen below filters from it, and the training tab
            in the bottom bar follows it too. */}
        <div className="mx-auto max-w-xl px-4 pb-3 lg:max-w-4xl">
          <SportSelector value={sport} onChange={setSport} />
        </div>
      </header>

      <RestTimerProvider
        prefs={{
          sound: db.settings.restSound,
          vibrate: db.settings.restVibrate,
        }}
      >
        <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-3 lg:max-w-4xl">
          {storage === "unavailable" ? (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3 text-[12px] font-medium text-danger">
              <AlertTriangle className="size-4 shrink-0" />
              <span>التصفح الخاص مفعل: بياناتك تحفظ مؤقتاً في هذه الجلسة فقط.</span>
            </div>
          ) : null}

          {status === "loading" ? (
            <div className="space-y-4 pt-6">
              <div className="h-44 w-full animate-pulse rounded-2xl bg-surface" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-24 animate-pulse rounded-xl bg-surface" />
                <div className="h-24 animate-pulse rounded-xl bg-surface" />
                <div className="h-24 animate-pulse rounded-xl bg-surface" />
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        <RestTimerBar />
      </RestTimerProvider>

      <BottomNav />
    </div>
  );
}
