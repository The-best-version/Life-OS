import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Sparkline } from "@/components/charts/sparkline";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Which of the studio's five colours this tile wears.
 *
 * A grid of four identical white boxes is a spreadsheet. Giving each tile its
 * own colour is what makes the row scannable at a glance — you learn where the
 * tonnage lives by its colour long before you read its label — and it is where
 * the identity's secondaries actually earn their place on the screen.
 *
 * `fill` is the bar and the icon chip; `ink` is the only value allowed to carry
 * the figure, because the fills are tuned for saturation and none of them clears
 * 4.5:1 as text on white.
 */
export type StatTone = "red" | "gold" | "cyan" | "violet" | "lime";

const TONE: Record<StatTone, { fill: string; ink: string }> = {
  red: { fill: "hsl(var(--primary))", ink: "hsl(var(--primary-ink))" },
  gold: { fill: "var(--spark-gold)", ink: "var(--spark-gold-ink)" },
  cyan: { fill: "var(--spark-cyan)", ink: "var(--spark-cyan-ink)" },
  violet: { fill: "var(--spark-violet)", ink: "var(--spark-violet-ink)" },
  lime: { fill: "var(--spark-lime)", ink: "var(--spark-lime-ink)" },
};

export interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  /** Signed change vs a named period. `null` hides the delta row. */
  delta?: {
    value: ReactNode;
    direction: "up" | "down" | "flat";
    period: string;
  } | null;
  trend?: readonly number[];
  trendLabel?: string;
  /** A quiet mark in the corner. Decoration for scanning, never the meaning. */
  icon?: LucideIcon;
  /** Set on the single tile that is the headline of the grid. */
  featured?: boolean;
  /** Defaults to the brand red. */
  tone?: StatTone;
  className?: string;
}

/**
 * Stat tile: colour bar · label · value · optional delta · optional sparkline.
 *
 * The figure is the point of the tile, so it is set large and in the tone's ink
 * while the label sits small and muted above it — the number should be readable
 * from further away than anything else on the card.
 *
 * The delta's colour is direction × whether up is good, and it always ships with
 * an arrow, so the meaning never rests on colour alone. The icon chip is
 * decoration for scanning and carries nothing a screen reader would miss.
 */
export function StatTile({
  label,
  value,
  unit,
  delta,
  trend,
  trendLabel,
  icon: Icon,
  featured = false,
  tone = "red",
  className,
}: StatTileProps) {
  /*
    Vertical arrows, never the diagonal pair.

    `ArrowUpRight` / `ArrowDownRight` shipped here first and they were unreadable:
    at this size, set on an Arabic line, a diagonal arrow has the silhouette of
    the لا ligature, so "↘ انخفاض 16%" was read as the word "لا" followed by the
    text. Enlarging it — the first attempt at a fix — only made the false letter
    bigger. A purely vertical arrow has no counterpart in the Arabic script, so
    it cannot be mistaken for one, and it carries no left/right bias to argue
    with the RTL flow.
  */
  const DeltaIcon =
    delta?.direction === "up"
      ? ArrowUp
      : delta?.direction === "down"
        ? ArrowDown
        : Minus;

  const { fill, ink } = TONE[tone];

  /* Both values ride as custom properties so the fill can be reused at several
     alphas below without repeating the colour, and so a `color-mix` is never
     needed for a plain tint. */
  const style = {
    "--tone": fill,
    "--tone-ink": ink,
  } as CSSProperties;

  return (
    <Card
      style={style}
      className={cn(
        "relative flex flex-col overflow-hidden p-3.5 pt-4",
        featured && "shadow-md",
        className,
      )}
    >
      {/* The tone bar. Full-bleed across the top edge, which is what makes a
          grid of these read as one coloured set rather than four white boxes. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: "var(--tone)" }}
      />

      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] font-bold leading-tight text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span
            aria-hidden
            className="grid size-7 shrink-0 place-items-center rounded-sm"
            style={{ backgroundColor: "color-mix(in srgb, var(--tone) 14%, transparent)" }}
          >
            <Icon className="size-4" style={{ color: "var(--tone-ink)" }} />
          </span>
        ) : null}
      </div>

      <p className="mt-2 flex items-baseline gap-1">
        <span
          className={cn("figure", featured ? "text-[34px]" : "text-[30px]")}
          style={{ color: "var(--tone-ink)" }}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-xs font-bold text-muted-foreground">{unit}</span>
        ) : null}
      </p>

      {delta ? (
        <p
          className={cn(
            "mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] font-bold",
            delta.direction === "up" && "text-success-ink",
            delta.direction === "down" && "text-muted-foreground",
            delta.direction === "flat" && "text-muted-foreground",
          )}
        >
          {/* Set in its own chip rather than loose in the line. Spacing alone
              was not enough to stop it being read as part of the word beside
              it — the glyph needs to sit on its own ground to read as a mark. */}
          <span
            aria-hidden
            className="grid size-4 shrink-0 place-items-center rounded-[4px] bg-foreground/[0.07]"
          >
            <DeltaIcon className="size-3" strokeWidth={2.75} />
          </span>
          {/* <bdi> keeps a signed value like "−12%" from being reordered by the
              surrounding RTL text into "%12−". */}
          <bdi className="tnum">{delta.value}</bdi>
          <span className="font-normal text-muted-foreground">
            {delta.period}
          </span>
        </p>
      ) : null}

      {trend && trend.length > 1 ? (
        <div className="mt-auto pt-2.5">
          <Sparkline values={trend} ariaLabel={trendLabel ?? label} />
        </div>
      ) : null}
    </Card>
  );
}
