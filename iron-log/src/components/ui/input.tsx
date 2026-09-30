import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Two deliberate deviations from a plain `<input>`:
 *
 *  1. **16px base font size.** Anything smaller makes iOS Safari zoom the page
 *     on focus, which is unusable when you are logging a set one-handed.
 *  2. **`type="number"` is rendered as a numeric text field.** The document is
 *     `lang="ar"`, and browsers render a real number input in Arabic-Indic
 *     digits (٢٦٠٠) while every computed value in the app is formatted with
 *     Latin digits — the two would disagree on the same screen. A text field
 *     with `inputMode` still raises the numeric keypad on mobile, and the value
 *     is validated in `lib/repository.ts` regardless, so nothing is lost.
 *     Pass `type="text"` explicitly to opt out.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type = "text", inputMode, min, max, step, ...props }, ref) => {
    const numeric = type === "number";
    return (
      <input
        ref={ref}
        type={numeric ? "text" : type}
        inputMode={numeric ? (inputMode ?? "decimal") : inputMode}
        // `min`/`max`/`step` mean nothing on a text field; keep them only where
        // the browser will actually honour them.
        min={numeric ? undefined : min}
        max={numeric ? undefined : max}
        step={numeric ? undefined : step}
        lang={type === "date" ? "en" : undefined}
        className={cn(
          "flex h-11 w-full rounded-md border border-border bg-secondary px-3 py-2 text-base font-bold text-foreground",
          "placeholder:font-normal placeholder:text-muted-foreground",
          "focus-visible:border-primary focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-[invalid=true]:border-primary",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
