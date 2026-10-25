import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The one card surface in the app. */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("plate", className)} {...props} />;
}

/** A section heading: title, optional trailing action. No paragraphs. */
export function SectionTitle({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2.5 mt-6 flex items-center justify-between gap-3 px-1", className)}>
      <h2 className="text-[15px] font-bold tracking-tight text-fg">{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * A tone passed to `Metric`/`Chip`. Only four roles exist: `accent` carries
 * every primary figure, `steel` is the one secondary data hue, and
 * `success`/`danger` are semantic — a PR or a warning, never decoration.
 */
export type Tone = "fg" | "accent" | "steel" | "success" | "danger";

/** A compact metric: label on top, big figure, optional unit and footnote. */
export function Metric({
  label,
  value,
  unit,
  foot,
  tone = "fg",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  foot?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const toneClass = {
    fg: "text-fg",
    accent: "text-accent-glow",
    steel: "text-steel",
    success: "text-success",
    danger: "text-danger",
  }[tone];

  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-[11.5px] font-semibold text-fg-3">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className={cn("num text-[30px] font-semibold leading-none", toneClass)}>
          {value}
        </span>
        {unit ? <span className="text-[12px] font-bold text-fg-3">{unit}</span> : null}
      </p>
      {foot ? <div className="mt-1.5 text-[12px] font-semibold text-fg-3">{foot}</div> : null}
    </div>
  );
}

/** A small pill. */
export function Chip({
  children,
  tone = "fg",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const toneClass = {
    fg: "bg-surface-2 text-fg-2 border-line-strong",
    accent: "bg-accent/12 text-accent-glow border-accent/30",
    steel: "bg-steel/12 text-steel border-steel/30",
    success: "bg-success/12 text-success border-success/30",
    danger: "bg-danger/12 text-danger border-danger/30",
  }[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold",
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** One quiet line for "nothing here yet". Never a paragraph. */
export function EmptyLine({
  icon,
  text,
  action,
  className,
}: {
  icon?: ReactNode;
  text: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-4 text-[13px] font-semibold text-fg-3",
        className,
      )}
    >
      {icon ? <span className="shrink-0 text-fg-3">{icon}</span> : null}
      <span className="min-w-0 flex-1">{text}</span>
      {action ? <span className="shrink-0">{action}</span> : null}
    </div>
  );
}
