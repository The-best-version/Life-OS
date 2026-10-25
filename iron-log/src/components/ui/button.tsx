import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "default" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white font-bold shadow-glowAccent hover:brightness-110 active:brightness-95",
  default:
    "bg-accent text-white font-bold shadow-glowAccent hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface-3 text-fg font-bold border border-line-strong hover:border-fg-3",
  ghost: "text-fg-2 font-bold hover:bg-white/[0.04] hover:text-fg",
  outline: "border border-line-strong text-fg font-bold hover:border-fg-3",
  danger:
    "bg-danger/15 text-danger font-bold border border-danger/35 hover:bg-danger/22",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-lg gap-1.5",
  md: "h-11 px-5 text-[14px] rounded-lg gap-2",
  lg: "h-14 px-6 text-[16px] rounded-xl gap-2.5",
  icon: "size-11 rounded-lg",
  "icon-sm": "size-9 rounded-lg",
};

/** The class string, for a `<Link>` that should look like a button. */
export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", asChild = false, className, type = "button", ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : type}
      className={cn(buttonClass(variant, size), className)}
      {...props}
    />
  );
});
