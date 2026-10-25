import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  /** Small label above the title. */
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Chips or controls under the subtitle. */
  children?: ReactNode;
  /**
   * True when the title is Latin (a program day such as "Push"), which sets
   * it in the condensed display face. Arabic titles never take it: Oswald has
   * no Arabic glyphs and would fall through to a system face mid-heading.
   */
  latinTitle?: boolean;
  className?: string;
}

/**
 * The banner every screen opens with.
 *
 * Shared rather than repeated per page so all five screens carry the same
 * tread underfoot — a page that opens on bare background reads as a
 * different, lesser app than the one next to it in the tab bar.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  latinTitle = false,
  className,
}: PageHeroProps) {
  return (
    <Card className={cn("tread relative isolate overflow-hidden px-5 py-5", className)}>
      <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-accent" />

      <p className="text-[11px] font-semibold tracking-wide text-fg-3">{eyebrow}</p>
      <h1
        className={cn(
          "mt-1.5",
          latinTitle
            ? "display text-[38px] font-semibold uppercase leading-none tracking-[0.01em] text-fg"
            : "text-[24px] font-bold leading-tight text-fg",
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <div className="mt-2 text-[12.5px] font-medium leading-relaxed text-fg-2">{subtitle}</div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </Card>
  );
}
