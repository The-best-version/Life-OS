"use client";

import { Minus, Plus } from "lucide-react";

import { cn, round, toFiniteNumber } from "@/lib/utils";

/**
 * A number field flanked by − / + buttons — the gym-floor input. The text
 * stays editable (a 37.5 is faster typed than tapped), the buttons step by
 * the machine's own increment.
 */
export function Stepper({
  id,
  label,
  value,
  onChange,
  step,
  min = 0,
  max = 9999,
  decimals = 2,
  unit,
  inputMode = "decimal",
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  step: number;
  min?: number;
  max?: number;
  decimals?: number;
  unit?: string;
  inputMode?: "decimal" | "numeric";
  className?: string;
}) {
  function nudge(direction: 1 | -1) {
    const current = toFiniteNumber(value) ?? 0;
    const next = round(Math.min(max, Math.max(min, current + direction * step)), decimals);
    onChange(String(next));
  }

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between px-1">
        <span className="text-[11.5px] font-bold text-fg-3">{label}</span>
        {unit ? <span className="text-[11px] font-bold text-fg-3">{unit}</span> : null}
      </label>
      <div className="flex h-14 items-stretch overflow-hidden rounded-xl border border-line-strong bg-surface focus-within:border-accent/60">
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label={`زيادة ${label}`}
          className="flex w-12 shrink-0 items-center justify-center text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg active:bg-surface-3"
        >
          <Plus className="size-5" aria-hidden />
        </button>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={(event) => event.target.select()}
          className="num min-w-0 flex-1 bg-transparent text-center text-[26px] font-semibold text-fg outline-none"
        />
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label={`إنقاص ${label}`}
          className="flex w-12 shrink-0 items-center justify-center text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg active:bg-surface-3"
        >
          <Minus className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
