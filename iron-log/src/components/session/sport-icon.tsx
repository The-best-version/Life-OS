/**
 * Where a discipline's icon is fastened on.
 *
 * `sports-config.ts` carries an `icon` key and no component, so the config
 * stays loadable with nothing rendered. This file is the one place that turns
 * that key into a glyph — the same arrangement `MUSCLE_GROUP_LABELS` has with
 * the charts that draw it.
 *
 * Three come from lucide. Equestrian is drawn here, because lucide has no
 * horse and the nearest animal glyph (a rabbit) would say something else
 * entirely; a horseshoe is the one shape nobody misreads. Stroked, 24×24,
 * `currentColor`, same weight as the lucide set it sits beside — an icon that
 * does not match the others reads as a bug rather than as a drawing.
 */

import { Dumbbell, Footprints, Swords, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import type { SportId } from "@/lib/types";

function Horseshoe({ className, ...props }: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide", className)}
      aria-hidden
      {...props}
    >
      <path d="M7.5 21v-7a4.5 4.5 0 0 1 9 0v7" />
      <path d="M6 21h3M15 21h3" />
      <path d="M10 6.5h4" />
    </svg>
  );
}

export const SPORT_ICONS: Record<SportId, ComponentType<LucideProps>> = {
  gym: Dumbbell,
  boxing: Swords,
  equestrian: Horseshoe,
  running: Footprints,
};

export function SportIcon({
  sport,
  className,
}: {
  sport: SportId;
  className?: string;
}) {
  const Icon = SPORT_ICONS[sport] ?? Dumbbell;
  return <Icon className={cn("size-5", className)} aria-hidden />;
}

/**
 * The sport's hue as an inline custom property.
 *
 * Every surface that belongs to a discipline reads `var(--sport)`, so a card,
 * a ring and a legend swatch all tint from one place and none of them needs a
 * map of its own. It is a *style* and not a class because the value comes from
 * data — a Tailwind class cannot be built from a config field.
 */
export function sportStyle(accentVar: string) {
  return { "--sport": `hsl(var(${accentVar}))` } as React.CSSProperties;
}
