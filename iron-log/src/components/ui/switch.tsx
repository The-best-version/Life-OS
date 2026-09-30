"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The thumb is positioned with the physical `right` property rather than a
 * translate: CSS transforms are never mirrored by `dir`, so a translate-based
 * thumb ends up on the wrong side in this RTL layout. With `right`, "off" is the
 * right edge (the start of the track here) in both directions.
 */
const Switch = React.forwardRef<
  React.ComponentRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "relative inline-flex h-[30px] w-[52px] shrink-0 cursor-pointer rounded-full border border-border transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none absolute top-1/2 block size-6 -translate-y-1/2 rounded-full shadow-lg",
        "right-[2px] transition-[right,background-color] duration-200",
        "bg-muted-foreground data-[state=checked]:right-[24px] data-[state=checked]:bg-white",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";

export { Switch };
