import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A styled native `<select>`.
 *
 * Deliberately not a Radix popover: on a phone the OS picker is faster, keeps
 * the keyboard/scroll behaviour users expect, and cannot get stranded off-screen
 * inside a scrolling card.
 */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "h-11 w-full appearance-none rounded-md border border-border bg-secondary px-3 pe-9 text-sm font-bold text-foreground",
        "focus-visible:border-primary focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden
      className="pointer-events-none absolute inset-y-0 end-3 my-auto size-4 text-muted-foreground"
    />
  </div>
));
Select.displayName = "Select";

export { Select };
