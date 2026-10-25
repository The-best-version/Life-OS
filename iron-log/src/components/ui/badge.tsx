import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none",
  {
    variants: {
      variant: {
        default: "border-accent/35 bg-accent/15 text-accent-glow",
        neutral: "border-line-strong bg-surface-2 text-fg-2",
        success: "border-success/35 bg-success/15 text-success",
        outline: "border-line-strong bg-transparent text-fg",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
