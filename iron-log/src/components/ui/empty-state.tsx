import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * The state most of this app is in on day one.
 *
 * A dashed grey rectangle with a grey icon says "nothing here"; on a first run
 * that is most of the screen, and the whole product reads as broken. So an empty
 * state is built like a card instead — the same steel plate, its own ember, and
 * an icon that is lit rather than greyed. It is still visibly empty, but it looks
 * like a place waiting to be filled.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("plate tread relative flex flex-col items-center gap-2 px-6 py-9 text-center", className)}>
      {Icon ? (
        <span className="relative flex size-11 items-center justify-center rounded-full border border-accent/25 bg-accent/10">
          <Icon className="size-5 text-accent-glow" aria-hidden />
        </span>
      ) : null}
      <p className="relative mt-0.5 text-[13.5px] font-bold text-fg">{title}</p>
      {description ? (
        <p className="relative max-w-[34ch] text-xs leading-relaxed text-fg-3">{description}</p>
      ) : null}
      {action ? <div className="relative mt-2">{action}</div> : null}
    </div>
  );
}
