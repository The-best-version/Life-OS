import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Sparkline } from "@/components/charts/sparkline";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatTone = "red" | "gold" | "cyan" | "violet" | "lime";

const TONE: Record<StatTone, { fill: string; ink: string }> = {
  red: { fill: "#FF2D55", ink: "#FF5277" },
  gold: { fill: "#FFB800", ink: "#FFC933" },
  cyan: { fill: "#00E5FF", ink: "#33EBFF" },
  violet: { fill: "#8B5CF6", ink: "#A78BFA" },
  lime: { fill: "#10B981", ink: "#34D399" },
};

export interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  delta?: {
    value: ReactNode;
    direction: "up" | "down" | "flat";
    period: string;
  } | null;
  trend?: readonly number[];
  trendLabel?: string;
  icon?: LucideIcon;
  featured?: boolean;
  tone?: StatTone;
  className?: string;
}

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
  const DeltaIcon =
    delta?.direction === "up"
      ? ArrowUp
      : delta?.direction === "down"
        ? ArrowDown
        : Minus;

  const { fill, ink } = TONE[tone];

  const style = {
    "--tone": fill,
    "--tone-ink": ink,
  } as CSSProperties;

  return (
    <Card
      style={style}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#131929]/95 via-[#0E1422]/90 to-[#0A0D16]/95 p-4 shadow-lg backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl",
        featured && "border-primary/40 shadow-[0_4px_24px_rgba(255,45,85,0.15)]",
        className,
      )}
    >
      {/* Neon Top Hairline */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2.5px]"
        style={{
          backgroundColor: "var(--tone)",
          boxShadow: "0 0 12px var(--tone)",
        }}
      />

      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-extrabold leading-tight text-slate-300 group-hover:text-white transition-colors">
            {label}
          </p>
          {Icon ? (
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-xl shadow-inner transition-transform duration-200 group-hover:scale-110"
              style={{
                backgroundColor: "color-mix(in srgb, var(--tone) 16%, transparent)",
                border: "1px solid color-mix(in srgb, var(--tone) 35%, transparent)",
              }}
            >
              <Icon className="size-4.5" style={{ color: "var(--tone)" }} />
            </span>
          ) : null}
        </div>

        <p className="mt-3 flex items-baseline gap-1.5">
          <span
            className={cn(
              "figure font-black tracking-tight text-white",
              featured ? "text-[32px] sm:text-[36px]" : "text-[28px] sm:text-[32px]",
            )}
          >
            {value}
          </span>
          {unit ? (
            <span className="text-[11px] font-bold text-slate-400">{unit}</span>
          ) : null}
        </p>

        {delta ? (
          <p
            className={cn(
              "mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-bold",
              delta.direction === "up" && "text-emerald-400",
              delta.direction === "down" && "text-rose-400",
              delta.direction === "flat" && "text-slate-400",
            )}
          >
            <span
              aria-hidden
              className="grid size-4 shrink-0 place-items-center rounded-md bg-white/[0.08]"
            >
              <DeltaIcon className="size-3" strokeWidth={3} />
            </span>
            <bdi className="tnum font-extrabold">{delta.value}</bdi>
            <span className="font-medium text-slate-400">
              {delta.period}
            </span>
          </p>
        ) : null}
      </div>

      {trend && trend.length > 1 ? (
        <div className="mt-4 border-t border-white/[0.06] pt-2.5">
          <Sparkline values={trend} ariaLabel={trendLabel ?? label} />
        </div>
      ) : null}
    </Card>
  );
}
