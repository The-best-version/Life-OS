"use client";

import { Flame, Timer, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/metrics";
import { formatNumber } from "@/lib/utils";

/**
 * The hero.
 *
 * Everything below it is charts; this is the only element in the app whose job
 * is to make you want to train. So it is the one surface that is not a white
 * card: it carries the brand ramp full-bleed, and the streak sits on it in solid
 * white at a size nothing else on the screen competes with.
 *
 * That inversion is the point. A dashboard where every card is the same white
 * rectangle has no focal point, and the number that is supposed to pull you back
 * tomorrow ends up the same visual weight as a lifetime tonnage total. One
 * saturated surface, at the top, and everything below it can stay calm.
 *
 * It has to survive being empty. A first-run user sees zeros, and zeros rendered
 * the same way as a 40-day streak is how an app announces it has nothing for you
 * — so at zero the hero drops the ring, changes the line, and puts a single
 * button where the number was.
 */
export function StudioHero({ summary }: { summary: DashboardSummary }) {
  const started = summary.streak > 0 || summary.totalSessions > 0;

  const goal = Math.max(1, summary.weeklyGoal);
  const progress = Math.min(1, summary.weekAttended / goal);

  return (
    <Card
      /* `grad-primary` paints a background-IMAGE. The fill underneath it is set
         with backgroundColor and never with the `background` shorthand, which
         would wipe the gradient along with it. */
      className="grad-primary relative isolate overflow-hidden border-transparent p-5 text-white shadow-lg"
    >
      {/* A light bloom in the top corner, so the ramp reads as a lit surface
          rather than a flat swatch. Opacity only — see the note on the figure
          below for why nothing here may animate a transform. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{
          inset: "-60% -20% auto -20%",
          height: "220%",
          background:
            "radial-gradient(46% 40% at 84% 14%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 40%, transparent 70%)",
        }}
      />
      <Barbell />

      <p className="text-[11px] font-bold tracking-wide text-white/75">
        {started ? "سلسلة أيام التدريب" : "أول يوم"}
      </p>

      <div className="mt-1.5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          {started ? (
            <p className="flex items-baseline gap-2">
              <span
                className="animate-fade-in block"
                style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.28))" }}
              >
                <span className="figure block text-[64px] leading-[0.82] text-white">
                  {summary.streak}
                </span>
              </span>
              <span className="text-[15px] font-bold text-white/80">يوم</span>
              {summary.streak > 0 ? (
                <Flame className="size-5 text-white" aria-hidden />
              ) : null}
            </p>
          ) : (
            <p className="max-w-[24ch] text-[21px] font-black leading-snug text-white">
              الحديد ما يرفع نفسه.
            </p>
          )}

          <p className="mt-2 max-w-[30ch] text-[12.5px] font-medium leading-relaxed text-white/85">
            {summary.streak > 0
              ? `أطول سلسلة وصلتها ${summary.longestStreak} يوم · ${summary.totalSessions} حصة مسجّلة`
              : started
                ? `${summary.totalSessions} حصة مسجّلة · ارجع اليوم وابدأ السلسلة من جديد`
                : "سجّل أول مجموعة، ومن بعدها كل رقم في هذي الشاشة يصير لك."}
          </p>
        </div>

        {started ? (
          <GoalRing
            progress={progress}
            attended={summary.weekAttended}
            goal={goal}
          />
        ) : null}
      </div>

      {started ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip
            icon={<TrendingUp className="size-3.5" aria-hidden />}
            label="حجم الأسبوع"
            value={`${formatNumber(summary.weekVolumeKg)} كجم`}
          />
          {summary.typicalSessionMin !== null ? (
            <Chip
              icon={<Timer className="size-3.5" aria-hidden />}
              label="الحصة عادةً"
              value={`${summary.typicalSessionMin} دقيقة`}
            />
          ) : null}
          {summary.weightChange30d !== null ? (
            <Chip
              /* Latin digits, like every other figure on this screen. The
                 Arabic-Indic "٣٠" that shipped here was the only one in the
                 app, and it sat two chips away from "53,235 كجم". */
              label="الوزن / 30 يوم"
              value={`${
                summary.weightChange30d > 0
                  ? "زيادة"
                  : summary.weightChange30d < 0
                    ? "نزول"
                    : "ثبات"
              } ${formatNumber(Math.abs(summary.weightChange30d))} كجم`}
            />
          ) : null}
        </div>
      ) : (
        /* Not the Button primitive: every primary button in the app is this
           exact ramp, and a red button on a red card is invisible. On this one
           surface the CTA inverts to solid white. */
        <Link
          href="/workout"
          className="press mt-4 flex min-h-tap w-full items-center justify-center rounded-lg bg-white px-5 text-[15px] font-black text-primary-ink shadow-md transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto"
        >
          ابدأ تمرين اليوم
        </Link>
      )}
    </Card>
  );
}

/**
 * The week against its goal, as a ring.
 *
 * A ring rather than a bar because it sits beside a very large number and a bar
 * would read as that number's underline. The count is printed inside it, so the
 * value never depends on reading an arc.
 *
 * On the brand surface the ring is drawn in white rather than in a token colour:
 * `--success` and `--primary` are both tuned against a near-white page and
 * neither survives being laid on saturated red. The "goal met" state is carried
 * by the ring closing and by the figure inside it, not by a hue swap.
 */
function GoalRing({
  progress,
  attended,
  goal,
}: {
  progress: number;
  attended: number;
  goal: number;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0">
      <svg
        viewBox="0 0 84 84"
        className="size-[84px]"
        role="img"
        aria-label={`أيام التدريب هذا الأسبوع ${attended} من ${goal}`}
      >
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.26)"
          strokeWidth="7"
        />
        <circle
          cx="42"
          cy="42"
          r={radius}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform="rotate(-90 42 42)"
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="figure text-[20px] text-white" dir="ltr">
          {attended}/{goal}
        </span>
        <span className="mt-0.5 text-[9px] font-bold text-white/75">
          هذا الأسبوع
        </span>
      </div>
    </div>
  );
}

function Chip({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white/85 backdrop-blur">
      {icon}
      {label}
      <span className="tnum font-black text-white">{value}</span>
    </span>
  );
}

/**
 * A loaded bar lying across the bottom of the hero.
 *
 * Drawn, not photographed: the app ships offline with no image assets, and a
 * vector silhouette re-tints itself instead of baking a colour in. It is
 * decoration and carries no information, so it is hidden from the accessibility
 * tree entirely.
 */
function Barbell() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 -bottom-2 -z-10 h-14 w-full opacity-[0.16]"
    >
      <g fill="#FFFFFF">
        {/* bar */}
        <rect x="70" y="27" width="260" height="6" rx="3" />
        {/* collars */}
        <rect x="88" y="21" width="9" height="18" rx="2" />
        <rect x="303" y="21" width="9" height="18" rx="2" />
        {/* plates, heaviest outermost */}
        <rect x="46" y="6" width="15" height="48" rx="4" />
        <rect x="64" y="11" width="12" height="38" rx="4" />
        <rect x="78" y="16" width="9" height="28" rx="3" />
        <rect x="313" y="16" width="9" height="28" rx="3" />
        <rect x="324" y="11" width="12" height="38" rx="4" />
        <rect x="339" y="6" width="15" height="48" rx="4" />
      </g>
    </svg>
  );
}
