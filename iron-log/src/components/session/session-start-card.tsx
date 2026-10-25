"use client";

/**
 * The card a discipline opens on.
 *
 * The sport changes the card's character through ONE wash of its own hue
 * behind the top-right corner (`.sport-wash`, 10%). The plan rows, the copy
 * and the CTA keep the system's own colours — that is the whole adaptation,
 * so a discipline is recognisable at a glance while the primary action never
 * changes colour and never has to be re-learned.
 *
 * The mode chips are the one input here. They are chips and not a dropdown
 * because the answer is always one of four and a dropdown would cost a tap to
 * find out.
 */

import { Zap } from "lucide-react";

import { sportStyle } from "@/components/session/sport-icon";
import { SportIcon } from "@/components/session/sport-icon";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/sports-config";
import type { SportConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

/** What a discipline's plan says before a single reading exists. */
function planRows(sport: SportConfig): Array<{ label: string; value: string }> {
  switch (sport.engine) {
    case "rounds":
      return [
        { label: "الجولات", value: `${sport.timer.rounds}` },
        {
          label: "جولة / راحة",
          value: `${formatClock(sport.timer.work)} / ${formatClock(sport.timer.rest)}`,
        },
        { label: "الهدف الأسبوعي", value: `${sport.weeklyTarget} حصص` },
      ];
    case "sets":
      return [
        { label: "الراحة الافتراضية", value: formatClock(sport.timer.rest) },
        { label: "الهدف الأسبوعي", value: `${sport.weeklyTarget} حصص` },
      ];
    default:
      return [
        { label: "الساعة", value: "تبدأ مع الحصة" },
        { label: "الهدف الأسبوعي", value: `${sport.weeklyTarget} حصص` },
      ];
  }
}

export function SessionStartCard({
  sport,
  mode,
  onModeChange,
  onStart,
  cta,
  subtitle,
  className,
}: {
  sport: SportConfig;
  mode: string;
  onModeChange(next: string): void;
  onStart(): void;
  cta?: string;
  subtitle?: string;
  className?: string;
}) {
  const rows = planRows(sport);

  return (
    <section
      style={sportStyle(sport.accentVar)}
      className={cn(
        "sport-wash relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-line-strong bg-surface p-4 shadow-plate sm:p-6",
        className,
      )}
    >
      <header className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-fg-3">
          <SportIcon sport={sport.id} className="size-4 text-[var(--sport)]" />
          التالي · {sport.nameAr}
        </span>
        <h2 className="display text-[30px] font-semibold leading-none text-fg" dir="ltr">
          {sport.name}
        </h2>
        {subtitle ? <p className="text-[13px] text-fg-2">{subtitle}</p> : null}
      </header>

      <div className="flex flex-wrap gap-1.5">
        {sport.modes.map((option) => {
          const active = option.id === mode;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onModeChange(option.id)}
              className={cn(
                "h-9 rounded-full border px-3.5 text-[12px] font-bold transition-colors duration-150",
                active
                  ? "border-line-strong bg-surface-3 text-fg"
                  : "border-line bg-transparent text-fg-3 hover:text-fg",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <dl className="flex flex-col gap-2 rounded-lg border border-line bg-bg p-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <dt className="text-fg">{row.label}</dt>
            <dd className="num text-fg-2">{row.value}</dd>
          </div>
        ))}
      </dl>

      <Button variant="primary" size="lg" className="w-full" onClick={onStart}>
        <Zap className="size-[22px]" aria-hidden />
        {cta ?? `ابدأ حصة ${sport.nameAr}`}
      </Button>
    </section>
  );
}
