import { cn, clamp, formatNumber } from "@/lib/utils";

interface MeterProps {
  label: string;
  value: number;
  target: number;
  unit?: string;
  className?: string;
}

/**
 * A goal meter. Per the viz rules the unfilled track is a lighter step of the
 * fill's own ramp (not a neutral grey), so the state reads across the whole bar,
 * and severity is carried by the fill: under target → accent, at/over → success.
 */
export function Meter({ label, value, target, unit, className }: MeterProps) {
  const safeTarget = target > 0 ? target : 0;
  const pct = safeTarget > 0 ? clamp((value / safeTarget) * 100, 0, 100) : 0;
  const met = safeTarget > 0 && value >= safeTarget;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between font-mono text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="tnum text-foreground">
          {formatNumber(value)}
          <span className="text-muted-foreground">
            {" / "}
            {formatNumber(safeTarget)}
            {unit ? ` ${unit}` : ""}
          </span>
        </span>
      </div>
      <div
        className={cn(
          "h-2 overflow-hidden rounded-full",
          met ? "bg-success/20" : "bg-primary/15",
        )}
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(safeTarget)}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            met ? "bg-success" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
