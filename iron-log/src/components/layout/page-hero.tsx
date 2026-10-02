import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  /** Small mono line above the title. */
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Chips or controls under the subtitle. */
  children?: ReactNode;
  /**
   * True when the title is Latin (a program day such as "Push"), which sets it
   * in the condensed display face. Arabic titles never take it: Oswald has no
   * Arabic glyphs and would fall through to a system face mid-heading.
   */
  latinTitle?: boolean;
  className?: string;
}

/**
 * The banner every screen opens with.
 *
 * Shared rather than repeated per page so all five screens carry the same forge
 * glow and the same tread underfoot — a page that opens on bare background reads
 * as a different, lesser app than the one next to it in the tab bar.
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
    <Card
      className={cn("relative isolate overflow-hidden px-5 py-5", className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{
          inset: "-60% -20% auto -20%",
          height: "240%",
          background:
            "radial-gradient(48% 40% at 84% 10%, rgba(255,122,47,0.3) 0%, rgba(236,58,33,0.12) 40%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{ backgroundImage: "var(--tread)", backgroundSize: "48px 48px" }}
      />

      <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
        {eyebrow}
      </p>
      <h1
        className={cn(
          // Opacity only: a title may contain `.molten-text`, and a transform on
          // an ancestor of background-clipped text makes Chrome drop the clip and
          // paint the glyphs as one flat block.
          "mt-1.5 animate-fade-in",
          latinTitle
            ? "display text-[40px] font-bold uppercase leading-none tracking-[0.02em]"
            : "text-[26px] font-black leading-tight",
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <div className="mt-2 text-[12.5px] font-medium leading-relaxed text-muted-foreground">
          {subtitle}
        </div>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </Card>
  );
}
