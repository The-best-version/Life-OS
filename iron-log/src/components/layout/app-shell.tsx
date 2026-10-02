"use client";

import { Flame, TriangleAlert } from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { RestTimerBar, RestTimerProvider } from "@/components/workout/rest-timer";
import { dashboardSummary } from "@/lib/metrics";
import { useIronLog } from "@/lib/store";
import { formatCompact, formatFullDate, toIsoDate } from "@/lib/utils";

/**
 * The chrome every page sits in: the knurled hairline, the sticky brand bar with
 * today's live tonnage, the storage banner, the rest timer and the bottom nav.
 *
 * Children render only once the database has been read on the client — that keeps
 * the server render and the first client render identical (no hydration
 * mismatch) and means no page ever has to handle a half-loaded database.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { db, index, status, storage, saveFailed, repaired } = useIronLog();

  const summary = useMemo(() => dashboardSummary(db, index), [db, index]);

  return (
    <div className="min-h-dvh">
      {/* The ground: fixed, behind everything, never painted over. */}
      <div className="daylight-ground" aria-hidden />

      <div className="iron-lattice" />

      <header
        className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex max-w-[560px] items-center justify-between gap-3 px-4 pb-2.5 pt-2.5 lg:max-w-[1060px]">
          <div className="flex items-center gap-2.5">
            <PlateMark />
            <div className="leading-none">
              <p className="molten-text display text-[17px] font-bold tracking-[0.16em]">
                IRON&nbsp;LOG
              </p>
              <p className="mt-[3px] text-[10px] font-bold text-muted-foreground">
                {formatFullDate(toIsoDate())}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {status === "ready" ? <TodayChip summary={summary} /> : null}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <RestTimerProvider
        prefs={{
          sound: db.settings.restSound,
          vibrate: db.settings.restVibrate,
        }}
      >
        <main className="mx-auto max-w-[560px] px-4 lg:max-w-[1060px]">
          {storage === "unavailable" ? (
            <Banner
              tone="error"
              title="التخزين غير متاح"
              body="المتصفح يمنع تخزين البيانات (غالباً وضع التصفح الخاص). التطبيق يعمل، لكن كل ما تسجّله يضيع عند إغلاق الصفحة."
            />
          ) : saveFailed ? (
            <Banner
              tone="error"
              title="فشل الحفظ"
              body="آخر تغيير ما انحفظ — قد تكون مساحة التخزين ممتلئة. صدّر نسخة احتياطية من الإعدادات قبل إغلاق الصفحة."
            />
          ) : repaired ? (
            <Banner
              tone="warn"
              title="تم إصلاح البيانات"
              body="بعض السجلات كانت تالفة وتم تجاهلها عند التحميل. باقي بياناتك سليمة."
            />
          ) : null}

          {status === "loading" ? <LoadingState /> : children}
        </main>

        <RestTimerBar />
      </RestTimerProvider>

      <BottomNav />
    </div>
  );
}

/**
 * The wordmark's mark.
 *
 * A weight plate seen face-on: the brand ramp on the rim, a light bore, and a
 * bar through it. Drawn rather than imported so it takes its colours from the
 * same ramp as the CTA and scales without a second asset.
 *
 * The bore is LIGHT, not dark. The previous mark filled it near-black, which was
 * legible on the old black ground and turned into an ink blot the moment the app
 * went light — the one element on the header that still looked like the app it
 * replaced.
 */
function PlateMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      className="size-9 shrink-0"
      role="img"
      aria-label="شعار Iron Log"
    >
      <defs>
        <linearGradient id="plate-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF4D6A" />
          <stop offset="52%" stopColor="#F5123C" />
          <stop offset="100%" stopColor="#A80A3F" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#plate-rim)" />
      <circle cx="20" cy="20" r="13.5" fill="hsl(var(--card))" />
      {/* The bar through the bore — what makes it read as a plate, not a coin. */}
      <rect x="17" y="9" width="6" height="22" rx="3" fill="url(#plate-rim)" />
      <circle cx="20" cy="20" r="3.2" fill="hsl(var(--card))" />
      {/* A single specular arc on the rim, so the disc reads as lit. */}
      <path
        d="M8 12a18 18 0 0 1 12-8"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Today at a glance, in the one place that is on every screen: tonnage moved and
 * sets logged, or the streak when nothing has been logged yet.
 */
function TodayChip({
  summary,
}: {
  summary: { todayVolumeKg: number; todaySets: number; streak: number };
}) {
  if (summary.todaySets > 0) {
    return (
      <div className="steel shrink-0 rounded-md border bg-card px-2.5 py-1.5 text-end">
        <p className="figure text-[15px] text-foreground">
          {formatCompact(summary.todayVolumeKg)}
          <span className="ms-1 font-sans text-[9.5px] font-bold text-muted-foreground">
            كجم اليوم
          </span>
        </p>
        <p className="mt-0.5 font-mono text-[9.5px] text-muted-foreground">
          {summary.todaySets} مجموعة
        </p>
      </div>
    );
  }

  return (
    <div className="steel flex shrink-0 items-center gap-1.5 rounded-md border bg-card px-2.5 py-2">
      <Flame
        className={
          summary.streak > 0
            ? "size-3.5 text-primary"
            : "size-3.5 text-muted-foreground"
        }
        aria-hidden
      />
      <span className="figure text-[14px]">{summary.streak}</span>
      <span className="text-[9.5px] font-bold text-muted-foreground">
        يوم سلسلة
      </span>
    </div>
  );
}

function Banner({
  tone,
  title,
  body,
}: {
  tone: "error" | "warn";
  title: string;
  body: string;
}) {
  return (
    <div
      role="alert"
      className={
        tone === "error"
          ? "mt-3 rounded-lg border border-primary/40 bg-primary/10 p-3"
          : "mt-3 rounded-lg border border-border bg-secondary p-3"
      }
    >
      <p className="flex items-center gap-1.5 text-[13px] font-extrabold">
        <TriangleAlert
          className={tone === "error" ? "size-4 text-primary" : "size-4 text-muted-foreground"}
          aria-hidden
        />
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 py-6">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-4 w-28" />
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-56" />
    </div>
  );
}
