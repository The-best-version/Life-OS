"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type ThemeChoice } from "@/lib/theme";
import { haptic } from "@/lib/motion";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "فاتح", icon: Sun },
  { value: "dark", label: "داكن", icon: Moon },
  { value: "system", label: "تلقائي", icon: Monitor },
];

/**
 * The compact header control: one button that flips light ↔ dark.
 *
 * It renders its icon from `resolved`, which is `null` until after mount — so
 * before then it shows the neutral monitor glyph rather than guessing light and
 * then correcting itself a frame later.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();

  const Icon = resolved === null ? Monitor : resolved === "dark" ? Sun : Moon;
  const label =
    resolved === null
      ? "تغيير المظهر"
      : resolved === "dark"
        ? "التبديل إلى المظهر الفاتح"
        : "التبديل إلى المظهر الداكن";

  return (
    <button
      type="button"
      onClick={() => {
        haptic();
        toggle();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "press grid size-11 shrink-0 place-items-center rounded-md border border-border",
        "bg-card text-muted-foreground shadow-sm",
        "hover:border-border-strong hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  );
}

/**
 * The full three-way control for the settings screen.
 *
 * «تلقائي» is a real option and not the absence of one: someone whose phone
 * switches at sunset wants the app to follow, and that intent cannot be expressed
 * by a two-state switch.
 */
export function ThemeChoiceGroup() {
  const { choice, setChoice } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="مظهر التطبيق"
      className="flex gap-1.5 rounded-md bg-secondary p-1.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = choice === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              haptic();
              setChoice(option.value);
            }}
            className={cn(
              "press flex min-h-tap flex-1 items-center justify-center gap-1.5 rounded-md",
              "px-2 text-xs font-bold",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
