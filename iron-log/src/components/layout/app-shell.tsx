"use client";

import { AlertTriangle, Flame } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { RestTimerBar, RestTimerProvider } from "@/components/workout/rest-timer";
import { dashboardSummary } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { formatCompact, formatFullDate, toIsoDate } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { db, index, status, storage } = useIronLog();
  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);

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
            {summary.todaySets > 0 ? (
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
                <span className="num text-[13px] font-semibold text-fg">{summary.streak}</span>
                <span className="text-[10px] font-semibold text-fg-3">يوم</span>
              </div>
            )}
          </div>
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
