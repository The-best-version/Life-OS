"use client";

/**
 * The live session shell.
 *
 * It mounts whatever logging surface the discipline's ENGINE needs, passed in
 * as children, and reads its stat strip straight off `sessionMetrics(session)`
 * — the sport's own calculators, so the strip cannot disagree with the trophy
 * shelf about the same session.
 *
 * It branches on `sport.engine` and never on `sport.id`: four disciplines
 * already share three surfaces, and a fifth that logs rounds should cost
 * nothing here.
 */

import { Flag } from "lucide-react";
import type { ReactNode } from "react";

import { SportIcon, sportStyle } from "@/components/session/sport-icon";
import { Button } from "@/components/ui/button";
import { formatClock, sessionMetrics } from "@/lib/sports-config";
import { getSport } from "@/lib/sports-config";
import type { AthleticSession } from "@/lib/types";
import { cn } from "@/lib/utils";

export function LiveSessionHUD({
  session,
  elapsedSeconds,
  title,
  onFinish,
  onDiscard,
  children,
  className,
}: {
  session: AthleticSession;
  /** Seconds since the session opened — the HUD does not keep a clock. */
  elapsedSeconds: number;
  title?: string;
  onFinish(): void;
  onDiscard(): void;
  /** The engine's logging surface: round tracker, dial, or set rows. */
  children: ReactNode;
  className?: string;
}) {
  const sport = getSport(session.sport);
  const readings = sessionMetrics(session);
  const mode = sport.modes.find((m) => m.id === session.mode);

  return (
    <section
      aria-label={`حصة ${sport.nameAr}`}
      style={sportStyle(sport.accentVar)}
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-line-strong bg-bg p-4 shadow-hud sm:p-5",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line-strong bg-surface-2 text-[var(--sport)]">
            <SportIcon sport={sport.id} className="size-[22px]" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-fg-3">
              حصة جارية · {sport.nameAr}
            </p>
            <h2 className="truncate text-[20px] font-bold leading-tight text-fg">
              {title ?? mode?.label ?? sport.nameAr}
            </h2>
          </div>
        </div>

        {/* Cyan, because an elapsed clock is a live measurement — not an
            action and not an achievement. */}
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-steel/10 px-2.5 py-1 text-[11px] font-bold tracking-wider text-steel">
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          <span className="num">{formatClock(elapsedSeconds)}</span>
        </span>
      </header>

      <div className="flex flex-col gap-4">{children}</div>

      {readings.length > 0 ? (
        <div className="flex flex-wrap gap-4 border-t border-line pt-3">
          {readings.map((reading) => (
            <div key={reading.key} className="flex min-w-[76px] flex-col gap-0.5">
              <b className="num text-[28px] font-semibold leading-none text-fg">
                {reading.display}
              </b>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">
                {reading.unit ? `${reading.label} · ${reading.unit}` : reading.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button variant="primary" className="flex-1" onClick={onFinish}>
          <Flag className="size-[18px]" aria-hidden />
          أنهِ الحصة
        </Button>
        {/* Destructive, but never something a thumb finds by accident
            mid-round: quiet, narrow, and off to the side. */}
        <Button variant="ghost" onClick={onDiscard}>
          تجاهل
        </Button>
      </div>
    </section>
  );
}
