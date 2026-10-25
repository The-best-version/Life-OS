"use client";

import { cn } from "@/lib/utils";

/** An accessible on/off switch. No dependency: it is one button. */
export function Switch({
  id,
  checked,
  onCheckedChange,
  label,
  className,
}: {
  id?: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200",
        checked ? "border-accent/60 bg-accent" : "border-line-strong bg-surface-3",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 size-5 -translate-y-1/2 rounded-full shadow transition-all duration-200",
          // RTL: "on" sits at the visual left (end), "off" at the right (start).
          checked ? "start-[calc(100%-1.5rem)] bg-black" : "start-1 bg-fg-2",
        )}
      />
    </button>
  );
}
