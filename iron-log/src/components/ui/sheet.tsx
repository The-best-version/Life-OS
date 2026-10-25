"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

/**
 * A bottom sheet. Modal: backdrop click and Escape close it, body scroll is
 * locked while open, and focus moves into the sheet so a keyboard user is not
 * left behind on the page underneath.
 *
 * It renders through a PORTAL into `document.body`, and must keep doing so.
 * Every screen wraps its content in `animate-fade-in`, and an element with a
 * filling opacity animation creates a stacking context: rendered in place, the
 * sheet's `z-[60]` would be trapped inside that context at level 0 and the
 * bottom nav's `z-40` would paint over it. That is not cosmetic — it lands
 * exactly on the sheet's footer, so the primary action becomes unclickable
 * while looking perfectly fine. Raising the z-index treats the symptom;
 * leaving the subtree is the fix.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  /* `document` does not exist during the server render, so the portal only
     opens after mount. The sheet is never part of the first paint anyway. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-2xl border border-line-strong bg-surface-2 shadow-lift outline-none animate-sheet-up sm:rounded-2xl sm:animate-scale-in",
          className,
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          <h2 className="text-[17px] font-bold text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex size-9 items-center justify-center rounded-full bg-surface-3 text-fg-2 transition-colors hover:text-fg"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
