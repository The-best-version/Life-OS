import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONE_VAR = {
  accent: "--accent",
  steel: "--steel",
  success: "--success",
  danger: "--danger",
} as const;

export type RingTone = keyof typeof TONE_VAR;

/** A progress ring. `value` is 0..1 and is clamped; >1 shows a full ring. */
export function Ring({
  value,
  size = 64,
  stroke = 6,
  tone = "accent",
  children,
  className,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: RingTone;
  children?: ReactNode;
  className?: string;
  label?: string;
}) {
  const safe = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = `hsl(var(${TONE_VAR[tone]}))`;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--line-strong))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - safe)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.2,0.8,0.2,1)" }}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
      ) : null}
    </div>
  );
}
