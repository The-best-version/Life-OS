"use client";

/**
 * A minimal toast system — enough to confirm a save or explain a rejection,
 * without pulling in a notification library for four lines of state.
 *
 * Toasts are announced politely to screen readers via `role="status"`, and the
 * whole stack is `pointer-events-none` so it can never swallow a tap meant for
 * the set below it.
 */

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn, createId } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast(message: string, tone?: ToastTone): void;
  success(message: string): void;
  error(message: string): void;
  dismiss(id: string): void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TIMEOUT_MS = 2600;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = createId("toast");
      setToasts((current) => [...current, { id, message, tone }].slice(-MAX_VISIBLE));
      const timer = setTimeout(() => dismiss(id), TIMEOUT_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  // Clear pending timers if the provider unmounts mid-toast.
  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const timer of map.values()) clearTimeout(timer);
      map.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message: string) => toast(message, "success"),
      error: (message: string) => toast(message, "error"),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-[420px] items-center gap-2 rounded-md border px-3 py-2.5 text-[13px] font-bold shadow-2xl backdrop-blur",
              item.tone === "success" &&
                "border-success/35 bg-success/15 text-success",
              item.tone === "error" &&
                "border-primary/40 bg-primary/15 text-primary",
              item.tone === "info" &&
                "border-border bg-popover/95 text-foreground",
            )}
          >
            {item.tone === "success" ? (
              <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            ) : item.tone === "error" ? (
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
            ) : (
              <Info className="size-4 shrink-0" aria-hidden />
            )}
            <span className="flex-1 leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="إغلاق"
              className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}
