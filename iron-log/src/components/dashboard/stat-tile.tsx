import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Sparkline } from "@/components/charts/sparkline";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
  /** Signed change vs a named period. `null` hides the delta row. */
  delta?: { value: string; direction: "up" | "down" | "flat"; period: string } | null;
  trend?: readonly number[];
  trendLabel?: string;
  className?: string;
}

/**
 * Stat tile: label · value · optional delta · optional sparkline.
 *
 * The delta's colour is direction × whether up is good — and it always ships with
 * an arrow, so the meaning never rests on colour alone.
 */
export function StatTile({
  label,
  value,
  unit,
  delta,
  trend,
  trendLabel,
  className,
}: StatTileProps) {
  const DeltaIcon =
    delta?.direction === "up"
      ? ArrowUpRight
      : delta?.direction === "down"
        ? ArrowDownRight
        : Minus;

  return (
    <Card className={cn("p-3.5", className)}>
      <p className="font-mono text-[10.5px] text-muted-foreground">{label}</p>
      <p className="mt-1 flex items-baseline gap-1 text-2xl font-extrabold leading-none">
        {value}
        {unit ? (
          <span className="text-xs font-bold text-muted-foreground">{unit}</span>
        ) : null}
      </p>

      {delta ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 font-mono text-[11px] font-bold",
            delta.direction === "up" && "text-success",
            delta.direction === "down" && "text-muted-foreground",
            delta.direction === "flat" && "text-muted-foreground",
          )}
        >
          <DeltaIcon className="size-3" aria-hidden />
          {/* <bdi> keeps a signed value like "−12%" from being reordered by the
              surrounding RTL text into "%12−". */}
          <bdi className="tnum">{delta.value}</bdi>
          <span className="font-normal text-muted-foreground">
            {delta.period}
          </span>
        </p>
      ) : null}

      {trend && trend.length > 1 ? (
        <div className="mt-2.5">
          <Sparkline values={trend} ariaLabel={trendLabel ?? label} />
        </div>
      ) : null}
    </Card>
  );
}
