import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          // 16px text: iOS zooms into anything smaller on focus.
          "h-11 w-full rounded-lg border border-line-strong bg-surface px-3.5 text-[16px] font-semibold text-fg outline-none transition-colors placeholder:font-medium placeholder:text-fg-3 focus:border-accent/60",
          className,
        )}
        {...props}
      />
    );
  },
);

/** Label + control, stacked. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-bold text-fg-2">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11.5px] font-medium text-fg-3">{hint}</p> : null}
    </div>
  );
}
